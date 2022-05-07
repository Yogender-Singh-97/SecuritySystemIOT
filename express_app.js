const morgan = require('morgan');
const express = require('express');
const path = require("path");
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const seq = require('sequelize');

const { isAuthenticated } = require('./config/auth');
// Passport Config
require('./config/passport')(passport);

//importing the model we exported in models
const db = require('./models');
const viewspath = path.join(__dirname, "/views");

const supervisoroutes = require('./routes/supervisor/supervisoroutes');
const systemadminroutes = require('./routes/system_admin/sysadminroutes');
const guardroutes = require('./routes/guard/guardroutes');

//initialising express app
const app = express();
//middleware for url encoding
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//url for mysql database connection
db.sequelize.sync({ alter: true }).then(function(){
  //listen for request
  app.listen(3000);
  console.log('connected!!! up and running!');
}).catch(function (err) {
    console.log(err);
});

//Passport related config
// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.fname = req.session.fname;;
  res.locals.lname = req.session.lname;
  res.locals.role = req.session.role;
  res.locals.uid = req.session.uid;
  next();
});

//initialising morgan
app.use(morgan('dev'));

//route to dafault page
app.get('/', function (req, res) {
  var error_s = "";

  const lerror = req.flash('error')
  if (lerror.length > 0) {
    error_s = "set";
  }

  res.render('../views/login/login1', { error_s })
});

//to receive the sensors data
app.post('/', async function (req, res) {
  var params = await req.body;
  var guardRFID = params.guardID;
  var receiverID = params.ReceiverID;

  var timeNow = new Date();
  var toSave = timeNow;

  const guardID = await db.users.findOne({
    where: {
      grfid: guardRFID
    }, attributes: [
      'user_id'
    ]
  });

  //if RFID entry is 'invalid' or PICC with guardRFID is not assigned to any guard
  if(guardID == undefined) {
    res.sendStatus(404).end();
    return;
  }

  const patrolID = await db.guard_allocations.findOne({
    where: {
      [seq.Op.and]: [
        {
          user_id: guardID.user_id
        },
        {
          allocation_status: "active"
        }
      ]
    }, attributes: [
      'patrol_id'
    ]
  });

  //if guard with Card exists in system but allocation is not done for him/her yet
  if(patrolID == undefined) {
    res.sendStatus(404).end();
    return;
  }

  const checkPointID = await db.checkpoints.findOne({
    where: {
      checkpoint_embeded_id: receiverID
    }, attributes: [
      'checkpoint_id'
    ]
  });

  const patrolParameters = await db.patrol_params.findOne({
    where: {
      [seq.Op.and]: [
        {
          patrol_id: patrolID.patrol_id
        },
        {
          checkpoint_id: checkPointID.checkpoint_id
        }
      ]
    }, attributes: [
      'lower_bound_time',
      'upper_bound_time',
      'patrol_params_id'
    ]
  });

  var hourNow = timeNow.getHours();
  var minNow = timeNow.getMinutes();

  var lbT = patrolParameters.lower_bound_time.split(':');
  var ubT = patrolParameters.upper_bound_time.split(':');

  var readStatus = "invalid";

  if (hourNow == lbT[0] && (minNow < ubT[1] && minNow > lbT[1])) {
    readStatus = "ok";
  } else {
    readStatus = "miss";
  }

  var currHour = toSave.getHours();
  var currMin = toSave.getMinutes();
  var readTime = new Date(toSave.setHours(currHour + 5, currMin + 30));

  const dataToPost = {};
  dataToPost.user_id = guardID.user_id;
  dataToPost.patrol_id = patrolID.patrol_id;
  dataToPost.checkpoint_id = checkPointID.checkpoint_id;
  dataToPost.patrol_params_id = patrolParameters.patrol_params_id;
  dataToPost.clocking_status = readStatus;
  dataToPost.clocking_time = readTime.toISOString();

  await db.guard_clocks.create(dataToPost).catch(function (err) {
    console.log(err);
  });

  if (readStatus == "miss") {
    //NOT acceptable check - in  
    res.sendStatus(406).end();
  } else {
    //OK acceptable check-in
    res.sendStatus(200).end();
  }
});

//adding routes per module
app.use('/supervisor', supervisoroutes);
app.use('/user', systemadminroutes);
app.use('/guard', guardroutes);

//midlle ware static
app.set("views", viewspath)

app.use(express.static(__dirname + '/public'))
//register ejs  (view engine)
app.set('view engine', 'ejs');
app.use(expressLayouts);