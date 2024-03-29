const db = require('../../models');
const fast2sms = require('fast-two-sms')
const _ = require('lodash');
var generator = require('generate-password');
const bcrypt = require('bcryptjs');
var validator = require("email-validator");
const validatePhoneNumber = require('validate-phone-number-node-js');
const date = require('date-and-time');
const Seq = require('sequelize');
const Op = Seq.Op;
const puppeteer = require('puppeteer');

//saving user
const guard_save = async function (req, res) {
  var params = req.body;
  var email = req.body.email;
  var grfid = req.body.grfid;
  var phonenumber = req.body.phonenumber;
  let errors = [];
  let success = [];
  try {
    // getting data for validation
    const users_count = await db.users.count({
      where: {
        email: req.body.email
      }
    });
    const users_gid_count = await db.users.count({
      where: {
        grfid: req.body.grfid
      }
    });
    const users_id_count = await db.users.count({
      where: {
        identification: req.body.identification
      }
    });
    const users_phone_count = await db.users.count({
      where: {
        phonenumber: req.body.phonenumber
      }
    });

    if (!validator.validate(req.body.email)) {
      errors.push({ msg: 'Invalid Email' });
    }
    if (!validatePhoneNumber.validate(phonenumber)) {
      errors.push({ msg: 'Invalid Phone Number' });
    }
    if (users_count > 0) {
      errors.push({ msg: 'User With Particular email Already Exist' });
    }
    if (users_id_count > 0) {
      errors.push({ msg: 'User With Particular Employee ID Already Exist' });
    }
    if (users_phone_count > 0) {
      errors.push({ msg: 'Phone number Already Registered by another user' });
    }
    if (users_gid_count > 0) {
      errors.push({ msg: 'Guard with Particular RFID CARD is already Registered' });
    }
    if (errors.length == 0) {
      //generate a user passowrd
      var passwd = generator.generate({
        length: 8,
        numbers: true
      });
      //encrypt the password
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(passwd, salt);
      params.password = hash;
      //saving user data to database
      db.users.create(params).catch(function (err) {
        console.log(err);
      });
      success.push({ msg: 'Guard successfully registered' });
      //sending username and password to the user
      message = "You account for Patrol system have been created, Your username is : " + email + " and Password: " + passwd;
      var options = { authorization: 'bRVqwyt6GYT7mNQzvkFOpSnhoC09XrEM8gZKA1dielPc25sBJLoUOnWaCl68usGf23FjKwdk1mADy54N', message: message, numbers: [phonenumber] };
      fast2sms.sendMessage(options).then(response => {
        console.log(response);
      });
    }

    res.render('../views/supervisor/registerguard', { success, errors });
  } catch (err) {
    console.log(err);
  }
}

//user manager
const guard_manage = async function (req, res) {
  var alertsm = req.flash('alerts1');

  if (alertsm.length < 1) {
    alertsm = "";
  }
  //pagination logic
  const pageAsNumber = Number.parseInt(req.params.pagen);
  let page = 0;
  let size = 10; //number of records per page
  if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
    page = pageAsNumber;
  }
  const users = await db.users.findAll({
    where: {
      role: 'guard'
    }
  }, {
    limit: size,
    offset: page * size
  });
  const totalusers = await db.users.count({
    where: {
      role: 'guard'
    }
  });
  const totalPages = Math.ceil(totalusers / Number.parseInt(size));
  //end of pagination logic

  res.render('../views/supervisor/guardmanager', { users, page, totalPages, alertsm, errors: req.flash('alerte1') });
}

//delete user
const delete_guard = async function (req, res) {
  var uid = req.params.uid;
  var errors = [];
  try {
    if (errors.length < 1) {
      await db.users.destroy({
        where: {
          user_id: uid
        }
      });

      req.flash('alerts1', 'Guard Deleted Successfully');
      res.redirect('/supervisor/gmanage/0');
    } else {
      res.redirect('/supervisor/gmanage/0');
    }
  } catch (err) {
    console.log(err);
  }
}

//disable user
const disable_guard = async function (req, res) {
  var uid = req.params.uid;
  var errors = [];
  try {
    if (errors.length < 1) {
      await db.users.update({
        status: 'not_current'
      }, {
        where: {
          user_id: uid
        }
      });

      req.flash('alerts1', 'Guard has been Disabled Successfully');
      res.redirect('/supervisor/gmanage/0');
    } else {
      res.redirect('/user/umanage/0');
    }
  } catch (err) {
    console.log(err);
  }
}

//enable user
const enable_guard = async function (req, res) {
  var uid = req.params.uid;
  var errors = [];
  try {
    await db.users.update({
      status: 'current'
    }, {
      where: {
        user_id: uid
      }
    });

    req.flash('alerts1', 'guard had been Enabled Successfully');
    res.redirect('/supervisor/gmanage/0');
  } catch (err) {
    console.log(err);
  }
}

//Update user getting the form
const update_guard1 = async function (req, res) {
  var success = [];
  var errors = [];
  var uid = req.params.uid;
  try {
    const users = await db.users.findOne({
      where: {
        user_id: uid
      }
    });

    res.render('../views/supervisor/updateguard', { users, success, errors, alertsm: "" });
  } catch (err) {
    console.log(err);
  }
}

//Update user getting the form
const update_guard2 = async function (req, res) {
  var uid = req.body.user_id;
  var params = req.body;
  var errors = [];
  var success = [];
  try {

    if (!validator.validate(req.body.email)) {
      errors.push({ msg: 'Invalid Email' });
    }
    if (!validatePhoneNumber.validate(req.body.phonenumber)) {
      errors.push({ msg: 'Invalid Phone Number' });
    }

    if (errors.length == 0) {
      const u_info = await db.users.findOne({
        where: {
          user_id: uid
        }
      });

      if (u_info.email != req.body.email) {
        const users_count = await db.users.count({
          where: {
            email: req.body.email
          }
        });

        if (users_count > 0) {
          errors.push({ msg: 'User With Particular email Already Exist' });
        }
      }

      if (u_info.identification != req.body.identification) {
        const users_id_count = await db.users.count(
          {
            where: {
              identification: req.body.identification
            }
          }
        );
        if (users_id_count > 0) {
          errors.push({ msg: 'User With Particular ID Already Exist' });
        }


      }

      if (u_info.phonenumber != req.body.phonenumber) {
        const users_phone_count = await db.users.count(
          {
            where: {
              phonenumber: req.body.phonenumber
            }
          }
        );

        if (users_phone_count > 0) {
          errors.push({ msg: 'Phone number Already Registered by another user' });
        }

      }


      if (u_info.grfid != req.body.grfid) {
        const users_g_count = await db.users.count(
          {
            where: {
              grfid: req.body.grfid
            }
          }
        );

        if (users_g_count > 0) {
          errors.push({ msg: 'Guard ID Card Already Registered by another user' });
        }

      }

      if (errors.length == 0) {
        await db.users.update(params,
          {
            where: {
              user_id: uid
            }
          }
        );
        req.flash('alerts1', 'User Updated Successfully');
        res.redirect('/supervisor/gmanage/0');
      }
      else {

        const users = await db.users.findOne(
          {
            where: {
              user_id: uid
            }
          }
        );
        res.render('../views/supervisor/updateguard', { users, success, errors, alertsm: "" });


      }
    } else {
      const users = await db.users.findOne({
        where: {
          user_id: uid
        }
      });

      res.render('../views/supervisor/updateguard', { users, success, errors, alertsm: "" });
    }
  } catch (err) {
    console.log(err);
  }
}

//userpassword reset
const guard_password_reset = async function (req, res) {
  var uid = req.params.uid;
  try {

    const u_info = await db.users.findOne({
      where: {
        user_id: uid
      }
    });

    //generate a user passowrd
    var passwd = generator.generate({
      length: 8,
      numbers: true
    });

    //encrypt the password
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(passwd, salt);

    //sending username and password to the user
    message = "Your Patrol System Account details have been reset ,your username is : " + u_info.email + " and new password is : " + passwd;
    var options = { authorization: 'bRVqwyt6GYT7mNQzvkFOpSnhoC09XrEM8gZKA1dielPc25sBJLoUOnWaCl68usGf23FjKwdk1mADy54N', message: message, numbers: [u_info.phonenumber] };
    fast2sms.sendMessage(options).then(response => {
      console.log(response);
    });

    await db.users.update({
      password: hash
    }, {
      where: {
        user_id: uid
      }
    });

    req.flash('alerts1', 'Password Was Reset Successfully & Details sent');
    res.redirect('/supervisor/gmanage/0');
  } catch (err) {
    console.log(err);
  }
}

//authentication for admin routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    req.user.then(function (result) {

      if (result.role != 'supervisor') {
        res.redirect('/');
      }
      else {
        return next();
      }
    });
  } else {
    res.redirect('/');
  }
}

//getting page for Guard Registration
const guard_register_get = async function (req, res) {
  var errors = [];
  var success = [];

  res.render('../views/supervisor/registerguard', { success, errors });
}

//getting page for Checkpoint Registration
const checkpoint_register_get = async function (req, res) {
  var errors = [];
  var success = [];

  const locations = await db.location.findAll();
  res.render('../views/supervisor/registercheckpoint', { locations, success, errors });
}

//saving Checkpoint
const checkpoint_save = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  try {
    const sensor_count = await db.checkpoints.count({
      where: {
        checkpoint_embeded_id: req.body.checkpoint_embeded_id
      }
    });

    if (sensor_count > 0) {
      errors.push({ msg: 'Checkpoint with particular ID is Already Registered' });
    }
    if (errors.length == 0) {

      db.checkpoints.create(params).catch(function (err) {
        console.log(err);
      });
      success.push({ msg: 'Checkpoint successfully registered' });
    }
    const locations = await db.location.findAll();
    res.render('../views/supervisor/registercheckpoint', { locations, success, errors });
  } catch (err) {
    console.log(err);
  }
}

//getting page for Checkpoint Manager
const checkpoint_manage = async function (req, res) {
  var alertsm = req.flash('alerts1');

  if (alertsm.length < 1) {
    alertsm = "";
  }
  //pagination logic
  const pageAsNumber = Number.parseInt(req.params.pagen);
  let page = 0;
  let size = 10; //number of records per page
  if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
    page = pageAsNumber;
  }

  const checkpoints = await db.checkpoints.findAll({
    include: {
      model: db.location, as: 'loc'
    },
    order: [['location_id', 'ASC']]
  }, {
    limit: size,
    offset: page * size
  });
  const total = await db.checkpoints.count();
  const totalPages = Math.ceil(total / Number.parseInt(size));
  //end of pagination logic

  res.render('../views/supervisor/checkpointmanager', { checkpoints, page, totalPages, alertsm, errors: req.flash('alerte1') });
}

//getting Page for Checkpoint Details Updater
const update_checkpoint1 = async function (req, res) {
  var success = [];
  var errors = [];
  var cid = req.params.cid;
  try {
    const checkpoint = await db.checkpoints.findOne({
      where: {
        checkpoint_id: cid
      }
    });
    const locations = await db.location.findAll();

    res.render('../views/supervisor/updatecheckpoint', { locations, checkpoint, success, errors, alertsm: "" });
  } catch (err) {
    console.log(err);
  }
}


const update_checkpoint2 = async function (req, res) {
  var cid = req.body.checkpoint_id;
  var params = req.body;
  var errors = [];
  var success = [];
  try {

    if (errors.length == 0) {
      const checkpoint_info = await db.checkpoints.findOne({
        where: {
          checkpoint_id: cid
        }
      });

      if (checkpoint_info.checkpoint_embeded_id != req.body.checkpoint_embeded_id) {
        const c_count = await db.checkpoints.count({
          where: {
            checkpoint_embeded_id: req.body.checkpoint_embeded_id
          }
        });

        if (c_count > 0) {
          errors.push({ msg: 'Checkpoint With Particular ID Already Exist' });
        }
      }

      if (errors.length == 0) {
        await db.checkpoints.update(params, {
          where: {
            checkpoint_id: cid
          }
        });

        req.flash('alerts1', 'checkpoint Updated Successfully');
        res.redirect('/supervisor/cmanage/0');
      } else {
        const checkpoint = await db.checkpoints.findOne({
          where: {
            checkpoint_id: cid
          }
        });
        const locations = await db.location.findAll();

        res.render('../views/supervisor/updatecheckpoint', { locations, checkpoint, success, errors, alertsm: "" });
      }
    } else {
      const checkpoint = await db.checkpoints.findOne({
        where: {
          checkpoint_id: cid
        }
      });
      const locations = await db.location.findAll();

      res.render('../views/supervisor/updatecheckpoint', { locations, checkpoint, success, errors, alertsm: "" });
    }
  } catch (err) {
    console.log(err);
  }
}

//Delete Check point
const delete_checkpoint = async function (req, res) {
  var cid = req.params.cid;
  var errors = [];
  try {
    if (errors.length < 1) {
      await db.checkpoints.destroy({
        where: {
          checkpoint_id: cid
        }
      });

      req.flash('alerts1', 'Checkpoint Deleted Successfully');
      res.redirect('/supervisor/cmanage/0');
    } else {
      res.redirect('/supervisor/cmanage/0');
    }
  } catch (err) {
    console.log(err);
  }
}

//Patrol Parameters
const patrol_register_get = async function (req, res) {
  var errors = [];
  var success = [];
  const checkpoints = await db.checkpoints.findAll();

  res.render('../views/supervisor/patrolregister', { checkpoints, success, errors });
}

//saving Patrol Data
const patrol_save = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  let now;
  let hrs;
  let mins;
  let lower_bound_time;
  let upper_bound_time;
  var lower_bound = new Array();
  var upper_bound = new Array();
  try {

    const patrol_count = await db.patrols.count({
      where: {
        patrol_name: req.body.patrol_name
      }
    });

    if (patrol_count > 0) {
      errors.push({ msg: 'Patrol with Similar Name Already Registered' });
    }
    if (params.checkpoint_threshod > 59) {
      errors.push({ msg: 'Threshold should be less than 60 minutes' });
    }

    //checking Duplicates time ranges
    let countc = 0;
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      for (let x = 0; x < params.checkpoint_id.length; x++) {
        if (params.expected_clock_time[i] == params.expected_clock_time[x] && x != i) {
          countc = countc + 1;
        }
      }
    }
    if (countc > 0) {
      errors.push({ msg: 'Duplicate Expected Time Entries' });
    }

    //checking overlapping time ranges
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
      lower_bound[i] = new Date(date.addMinutes(now, -params.checkpoint_threshod));
      upper_bound[i] = new Date(date.addMinutes(now, params.checkpoint_threshod));
    }

    let countcr = 0;
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      for (let x = 0; x < params.checkpoint_id.length; x++) {
        if (lower_bound[i].getTime() >= lower_bound[x].getTime() && lower_bound[i].getTime() <= upper_bound[x].getTime() && x != i) {
          countcr = countcr + 1;
        }
        if (upper_bound[i].getTime() >= lower_bound[x].getTime() && upper_bound[i].getTime() <= upper_bound[x].getTime() && x != i) {
          countcr = countcr + 1;
        }
      }
    }
    if (countcr > 0) {
      errors.push({ msg: 'Overlapping Time Entries' });
    }

    if (errors.length == 0) {
      db.patrols.create({
        checkpoint_threshod: params.checkpoint_threshod,
        Patrol_description: params.Patrol_description,
        patrol_name: params.patrol_name
      }).then(function (pid) {

        for (let i = 0; i < params.checkpoint_id.length; i++) {
          //calculate lower bound
          now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
          hrs = new Date(date.addMinutes(now, -params.checkpoint_threshod)).getHours();
          mins = new Date(date.addMinutes(now, -params.checkpoint_threshod)).getMinutes();
          if (mins < 10) {
            mins = "0" + mins;
          }

          lower_bound_time = hrs + ':' + mins;
          //calculate upper bound
          now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
          hrs = new Date(date.addMinutes(now, params.checkpoint_threshod)).getHours();
          mins = new Date(date.addMinutes(now, params.checkpoint_threshod)).getMinutes();
          if (mins < 10) {
            mins = "0" + mins;
          }

          upper_bound_time = hrs + ':' + mins;
          db.patrol_params.create({
            patrol_id: pid.patrol_id,
            checkpoint_id: params.checkpoint_id[i],
            lower_bound_time: lower_bound_time,
            upper_bound_time: upper_bound_time,
            expected_clock_time: params.expected_clock_time[i]
          });
        }
      });
      success.push({ msg: 'Patrol successfully registered' });
    }
    const checkpoints = await db.checkpoints.findAll();

    res.render('../views/supervisor/patrolregister', { checkpoints, success, errors });
  } catch (err) {
    console.log(err);
  }
}

//Getting page for Patrol Management
const patrol_manage = async function (req, res) {
  var alertsm = req.flash('alerts1');

  if (alertsm.length < 1) {
    alertsm = "";
  }
  //pagination logic
  const pageAsNumber = Number.parseInt(req.params.pagen);
  let page = 0;
  let size = 10; //number of records per page
  if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
    page = pageAsNumber;
  }

  const patrols = await db.patrols.findAll({
    include: {
      model: db.patrol_params, as: 'patrol_param'
    },
    limit: size,
    offset: page * size
  });
  const total = await db.patrols.count();
  const totalPages = Math.ceil(total / Number.parseInt(size));
  //end of pagination logic

  res.render('../views/supervisor/patrolmanager', { patrols, page, totalPages, alertsm, errors: req.flash('alerte1') });
}
//Getting Page for updating Patrol Details
const update_patrol1 = async function (req, res) {
  var success = [];
  var errors = [];
  var pid = req.params.pid;
  try {

    const patrol = await db.patrols.findOne({
      where: {
        patrol_id: pid
      },
      include:
      {
        model: db.patrol_params, as: 'patrol_param'
      }
    });
    const checkpoints = await db.checkpoints.findAll();

    res.render('../views/supervisor/patrolupdate', { patrol, checkpoints, success, errors, alertsm: "" });
  } catch (err) {
    console.log(err);
  }
}

//Saving Updated Patrol Details
const update_patrol2 = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  let now;
  let hrs;
  let mins;
  let lower_bound_time;
  let upper_bound_time;
  var lower_bound = new Array();
  var upper_bound = new Array();
  try {

    const patrol_count = await db.patrols.count({
      where: {
        patrol_name: req.body.patrol_name,
        [Op.not]: [
          {
            patrol_id: params.patrol_id
          }
        ]
      }
    });

    if (patrol_count > 0) {
      errors.push({ msg: 'Patrol with Similar Name Already Registered' });
    }
    if (params.checkpoint_threshod > 59) {
      errors.push({ msg: 'Threshold should be less than 60 minutes' });
    }

    //checking Duplicates time ranges
    let countc = 0;
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      for (let x = 0; x < params.checkpoint_id.length; x++) {
        if (params.expected_clock_time[i] == params.expected_clock_time[x] && x != i) {
          countc = countc + 1;
        }
      }
    }

    if (countc > 0) {
      errors.push({ msg: 'Duplicate Expected Time Entries' });
    }

    //checking overlapping time ranges
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
      lower_bound[i] = new Date(date.addMinutes(now, -params.checkpoint_threshod));
      upper_bound[i] = new Date(date.addMinutes(now, params.checkpoint_threshod));
    }

    let countcr = 0;
    for (let i = 0; i < params.checkpoint_id.length; i++) {
      for (let x = 0; x < params.checkpoint_id.length; x++) {
        if (lower_bound[i].getTime() >= lower_bound[x].getTime() && lower_bound[i].getTime() <= upper_bound[x].getTime() && x != i) {
          countcr = countcr + 1;
        }
        if (upper_bound[i].getTime() >= lower_bound[x].getTime() && upper_bound[i].getTime() <= upper_bound[x].getTime() && x != i) {
          countcr = countcr + 1;
        }
      }
    }

    if (countcr > 0) {
      errors.push({ msg: 'Overlapping Time Entries' });
    }

    if (errors.length == 0) {
      await db.patrols.update({
        Patrol_description: params.Patrol_description,
        patrol_name: params.patrol_name,
        checkpoint_threshod:params.checkpoint_threshod
      }, {
        where: {
          patrol_id: params.patrol_id
        }
      });

      let pid = params;

      await db.patrol_params.destroy({
        where: {
          patrol_id: params.patrol_id
        }
      });

      for (let i = 0; i < params.checkpoint_id.length; i++) {
        //calculate lower bound
        now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
        hrs = new Date(date.addMinutes(now, -params.checkpoint_threshod)).getHours();
        mins = new Date(date.addMinutes(now, -params.checkpoint_threshod)).getMinutes();
        if (mins < 10) {
          mins = "0" + mins;
        }
        lower_bound_time = hrs + ':' + mins;

        //calculate upper bound
        now = new Date("Sat Mar 12 2022 " + params.expected_clock_time[i] + ":00");
        hrs = new Date(date.addMinutes(now, params.checkpoint_threshod)).getHours();
        mins = new Date(date.addMinutes(now, params.checkpoint_threshod)).getMinutes();
        if (mins < 10) {
          mins = "0" + mins;
        }
        upper_bound_time = hrs + ':' + mins;

        db.patrol_params.create({
          patrol_id: pid.patrol_id,
          checkpoint_id: params.checkpoint_id[i],
          lower_bound_time: lower_bound_time,
          upper_bound_time: upper_bound_time,
          expected_clock_time: params.expected_clock_time[i]
        });
      }

      req.flash('alerts1', 'Patrol Updated Successfully');
      const checkpoints = await db.checkpoints.findAll();
      res.redirect('/supervisor/pmanage/0');
    } else {
      const patrol = await db.patrols.findOne({
        where: {
          patrol_id: params.patrol_id
        },
        include:
        {
          model: db.patrol_params, as: 'patrol_param'
        }
      });
      const checkpoints = await db.checkpoints.findAll();

      res.render('../views/supervisor/patrolupdate', { patrol, checkpoints, success, errors, alertsm: "" });
    }
  } catch (err) {
    console.log(err);
  }
}

//deleting patrol
const delete_patrol = async function (req, res) {
  var pid = req.params.pid;
  var errors = [];
  try {
    if (errors.length < 1) {
      await db.patrols.destroy({
        where: {
          patrol_id: pid
        }
      });

      req.flash('alerts1', 'Patrol Deleted Successfully');
      res.redirect('/supervisor/pmanage/0');
    } else {
      res.redirect('/supervisor/pmanage/0');
    }
  } catch (err) {
    console.log(err);
  }
}

//Getting Page for Guard Allocations
const gallocation_get = async function (req, res) {
  var errors = [];
  var success = [];

  const patrols = await db.patrols.findAll();
  const guards = await db.users.findAll({ where: { role: 'guard' } });

  res.render('../views/supervisor/guardsallocation', { guards, patrols, success, errors });
}

//Guard Allocation Modify
const gmodify_get = async function (req, res) {
  var errors = [];
  var success = [];

  const patrols_selected = await db.guard_allocations.findOne({
    where: {
      user_id: req.params.gid
    }
  });

  //in case allocation is not yet done for this particular guard
  if(patrols_selected == undefined) {
    var errorMsg = "No Allocation is done for the Guard Yet!";
    req.flash('alerts1',errorMsg);
    return res.redirect("/supervisor/gmanage/0");
  }

  const patrols_selected1 = await db.guard_allocations.findAll({
    where: {
      user_id: req.params.gid
    }
  });
  const patrols = await db.patrols.findAll();
  const guards = await db.users.findAll({
    where: {
      user_id: req.params.gid
    }
  });

  res.render('../views/supervisor/gallocationmodify', { patrols_selected, patrols_selected1, guards, patrols, success, errors });
}

//Allocation Save
const asave = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  var upper_bound = new Array();
  try {
    //checking Duplicate Guards
    let countg = 0;
    for (let i = 0; i < params.user_id.length; i++) {
      for (let x = 0; x < params.user_id.length; x++) {
        if (params.user_id[i] == params.user_id[x] && x != i) {
          countg = countg + 1;
        }
      }
    }
    if (countg > 0) {
      errors.push({ msg: 'Duplicate Guard Entries' });
    }

    //Checking Duplicate Patrols  
    let countp = 0;
    for (let i = 0; i < params.patrol_id.length; i++) {
      for (let x = 0; x < params.patrol_id.length; x++) {
        if (params.patrol_id[i] == params.patrol_id[x] && x != i) {
          countp = countp + 1;
        }
      }
    }
    if (countp > 0) {
      errors.push({ msg: 'Duplicate Patrol Entries' });
    }

    if (errors.length == 0) {
      for (let i = 0; i < params.user_id.length; i++) {
        for (let x = 0; x < params.patrol_id.length; x++) {
          db.guard_allocations.create({
            shift_start: params.shift_start,
            shift_stop: params.shift_stop,
            week_start_day: params.week_start_day,
            week_stop_day: params.week_stop_day,
            patrol_id: params.patrol_id[x],
            user_id: params.user_id[i]
          });
        }
      }
      success.push({ msg: 'Guard(s) allocated successfully' });
    }

    const patrols = await db.patrols.findAll();
    const guards = await db.users.findAll({
      where: {
        role: 'guard'
      }
    });

    res.render('../views/supervisor/guardsallocation', { guards, patrols, success, errors });
  } catch (err) {
    console.log(err);
  }
}

//Allocation Save
const gmodify_save = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  try {
    //checking Duplicate Guards
    let countg = 0;
    for (let i = 0; i < params.user_id.length; i++) {
      for (let x = 0; x < params.user_id.length; x++) {
        if (params.user_id[i] == params.user_id[x] && x != i) {
          countg = countg + 1;
        }
      }
    }
    if (countg > 0) {
      errors.push({ msg: 'Duplicate Guard Entries' });
    }

    //Checking Duplicate Patrols  
    let countp = 0;
    for (let i = 0; i < params.patrol_id.length; i++) {
      for (let x = 0; x < params.patrol_id.length; x++) {
        if (params.patrol_id[i] == params.patrol_id[x] && x != i) {
          countp = countp + 1;
        }
      }
    }
    if (countp > 0) {
      errors.push({ msg: 'Duplicate Patrol Entries' });
    }

    if (errors.length == 0) {
      //updating old records
      var old_patrols = new Array();
      var count_old = 0;

      const patrols_old_selected = await db.guard_allocations.findOne({
        where: {
          user_id: req.body.user_id
        }
      });

      for (let i = 0; i < patrols_old_selected.length; i++) {
        for (let x = 0; x < req.body.patrol_id.length; x++) {
          if (req.body.patrol_id[i] == patrols_old_selected.length[x]) {
            count_old = count_old + 1;
          }
        }
        if (count_old == 0) {
          old_patrols.push(patrols_old_selected[i]);
        }
        count_old = 0;
      }

      for (let x = 0; x < old_patrols.length; x++) {
        await db.users.guard_allocations({
          allocation_status: 'inactive'
        }, {
          where: {
            user_id: params.user_id[0],
            patrol_id: old_patrols[x]
          }
        });
      }

      await db.guard_allocations.destroy({
        where: {
          user_id: params.user_id[0],
          allocation_status: 'active'
        }
      });

      //inserting the new records
      for (let i = 0; i < params.user_id.length; i++) {
        for (let x = 0; x < params.patrol_id.length; x++) {
          db.guard_allocations.create({
            shift_start: params.shift_start,
            shift_stop: params.shift_stop,
            week_start_day: params.week_start_day,
            week_stop_day: params.week_stop_day,
            patrol_id: params.patrol_id[x],
            user_id: params.user_id[i]
          });
        }
      }

      req.flash('alerts1', 'Guard Allocation Updated successfully');
      res.redirect('/supervisor/gmanage/0');
    } else {
      const patrols_selected = await db.guard_allocations.findOne({
        where: {
          user_id: params.user_id[0]
        }
      });
      const patrols = await db.patrols.findAll();
      const guards = await db.users.findAll({
        where: {
          user_id: params.user_id[0]
        }
      });

      res.render('../views/supervisor/gallocationmodify', { patrols_selected, guards, patrols, success, errors });
    }
  } catch (err) {
    console.log(err);
  }
}

const preport_get = async function (req, res) {
  var errors = [];
  var success = [];

  const patrols = await db.patrols.findAll({
    include: [
      {
        model: db.guard_allocations, as: 'allocation'
      }
    ]
  });
  const users = await db.users.findAll();

  res.render('../views/supervisor/preport', { users, patrols, success, errors });
}

const pusers_get = async function (req, res) {
  var errors = [];
  var success = [];

  const patrol_users = await db.guard_allocations.findAll({
    where: {
      patrol_id: req.params.pid
    },
    include:
    {
      model: db.users, as: 'guard'
    }
  });

  res.json(patrol_users);
}

//generate Patrol Report
const pgenerate = async function (req, res) {
  var params = req.body;
  var gid = params.user_id;
  var start_d = new Date(params.start_date);
  var stop_d = new Date(params.stop_date);

  if (gid == null) {
    gid = 0;
  }

  let errors = [];
  let success = [];
  try {
    if (start_d > stop_d) {
      errors.push({ msg: 'Error! Start Date is less than stop date' });
    }

    if (errors.length == 0) {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto('http://localhost:3000/supervisor/pgenerate1/' + params.patrol_id + '/' + start_d + '/' + stop_d + '/' + params.sel_opt + '/' + gid, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });

      await browser.close();
      res.set("Content-Type", "application/pdf");
      res.send(pdf);
    } else {
      const patrols = await db.patrols.findAll();

      res.render('../views/supervisor/preport', { patrols, success, errors });
    }
  } catch (err) {
    console.log(err);
  }
}

//Patrol report Functionality
const report_patrol = async function (req, res) {
  var success = [];
  var errors = [];
  var pid = req.params.pid;
  var gid1 = req.params.gid;
  var start_d = new Date(req.params.start_date);
  var stop_d = new Date(req.params.stop_date);
  var allocation_headers;
  var clockings;
  var D_start;
  var D_stop;
  var syr;
  var smnt;
  var dt;
  try {
    //fetching Patrol headers
    const patrol_headers = await db.patrols.findAll({
      where: {
        patrol_id: pid
      },
      include:
      {
        model: db.patrol_params, as: 'patrol_param', include: { model: db.checkpoints, as: 'checkpoint' }
      }
    });
    //Fetching Allocation Headers Clocks
    start_d = new Date(start_d.getFullYear(), start_d.getMonth(), start_d.getDate());
    stop_d = new Date(stop_d.getFullYear(), stop_d.getMonth(), stop_d.getDate() + 1);

    //Manual formating date to I=SO String
    syr = start_d.getFullYear();
    smnt = start_d.getMonth()+1;
    dt = start_d.getDate();

     if (dt < 10) {
       dt = '0' + dt;
     }
     if (smnt < 10) {
       smnt = '0' + smnt;
     }
     D_start =  syr+'-'+smnt+'-'+dt+'T00:00:00.000Z';
  
   //
   syr = stop_d.getFullYear();
   smnt = stop_d.getMonth()+1;
   dt = stop_d.getDate();

    if (dt < 10) {
      dt = '0' + dt;
    }
    if (smnt < 10) {
      smnt = '0' + smnt;
    }
    D_stop =  syr+'-'+smnt+'-'+dt+'T00:00:00.000Z';


    //Fetching Allocation Headers Clocks
    if (gid1 == 0) {
      allocation_headers = await db.guard_allocations.findAll({
        where: {
          patrol_id: pid
        },
        include: {
          model: db.users, as: 'guard'
        }
      });
      clockings = await db.guard_clocks.findAll({
        where: {
          patrol_id: pid, createdAt: { [Op.between]: [D_start, D_stop] }
        },
        include: {
          model: db.patrol_params, as: 'patrol_param',
          include: {
            model: db.checkpoints, as: 'checkpoint',
            include: {
              model: db.location, as: 'loc'
            }
          }
        }
      });
    } else if (gid1 == -1) {
      allocation_headers = await db.guard_allocations.findAll({
        where: {
          patrol_id: pid
        },
        include: {
          model: db.users, as: 'guard'
        }
      });
      clockings = await db.guard_clocks.findAll({
        where: {
          patrol_id: pid,
        },
        include: {
          model: db.patrol_params, as: 'patrol_param',
          include: {
            model: db.checkpoints, as: 'checkpoint',
            include: {
              model: db.location, as: 'loc'
            }
          }
        }
      });
    } else {
      allocation_headers = await db.guard_allocations.findAll({
        where: {
          patrol_id: pid, user_id: gid1
        },
        include: {
          model: db.users, as: 'guard'
        }
      });
      clockings = await db.guard_clocks.findAll({
        where: {
          patrol_id: pid,
          createdAt: {
            [Op.between]: [D_start, D_stop]
          }
        }, include: {
          model: db.patrol_params, as: 'patrol_param',
          include: {
            model: db.checkpoints, as: 'checkpoint',
            include: {
              model: db.location, as: 'loc'
            }
          }
        }
      });
    }
    start_d=dateconversion(new Date(req.params.start_date));
    stop_d=dateconversion(new Date(req.params.stop_date)); 
    res.render('../views/supervisor/patrol_report_raw', { start_d, stop_d, clockings, allocation_headers, patrol_headers, success, errors });
  } catch (err) {
    console.log(err);
  }
}

//Dashboard
const dashboard_get = async function (req, res) {
  var errors = [];
  var success = [];
  const patrols = await db.patrols.findAll({
    include: [{
      model: db.patrol_params, as: 'patrol_param'
    }, {
      model: db.guard_allocations, as: 'allocation'
    }]
  });
  const guards = await db.users.findAll({
    where: {
      role: 'guard'
    }
  });
  const checkpoints = await db.checkpoints.findAll();
  const clocks = await db.guard_clocks.findAll();

  res.render('../views/supervisor/dashboard', { guards, patrols, checkpoints, clocks, success, errors });
}

const dpreport_generate = async function (req, res) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/supervisor/pgenerate1/' + req.params.pid + '/0/0/0/-1', { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();
    res.set("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    console.log(err);
  }
}

//Location Registration Form
const location_register_get = async function (req, res) {
  var errors = [];
  var success = [];

  res.render('../views/supervisor/registerlocation', { success, errors });
}

//saving Checkpoint
const location_save = async function (req, res) {
  var params = req.body;
  let errors = [];
  let success = [];
  try {

    const location_count = await db.location.count({
      where: {
        location_name: req.body.location_name
      }
    });
    if (location_count > 0) {
      errors.push({ msg: 'Location is Already Registered' });
    }

    if (errors.length == 0) {
      db.location.create(params).catch(function (err) {
        console.log(err);
      });

      success.push({ msg: 'Location successfully registered' });
    }

    res.render('../views/supervisor/registerlocation', { success, errors });
  } catch (err) {
    console.log(err);
  }
}

const location_manage = async function (req, res) {
  var alertsm = req.flash('alerts1');

  if (alertsm.length < 1) {
    alertsm = "";
  }
  //pagination logic
  const pageAsNumber = Number.parseInt(req.params.pagen);
  let page = 0;
  let size = 10; //number of records per page
  if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
    page = pageAsNumber;
  }
  const locations = await db.location.findAll({
    order: [['location_id', 'ASC']]
  }, {
    limit: size,
    offset: page * size
  });
  const total = await db.location.count();
  const totalPages = Math.ceil(total / Number.parseInt(size));
  //end of pagination logic

  res.render('../views/supervisor/locationmanager', { locations, page, totalPages, alertsm, errors: req.flash('alerte1') });
}

const update_location1 = async function (req, res) {
  var success = [];
  var errors = [];
  var lid = req.params.lid;
  try {
    const location = await db.location.findOne({
      where: {
        location_id: lid
      }
    });

    res.render('../views/supervisor/updatelocation', { location, success, errors, alertsm: "" });
  } catch (err) {
    console.log(err);
  }
}

const update_location2 = async function (req, res) {
  var lid = req.body.location_id;
  var params = req.body;
  var errors = [];
  var success = [];
  try {
    if (errors.length == 0) {
      const location_info = await db.location.findOne({
        where: {
          location_id: lid
        }
      });

      if (location_info.location_name != req.body.location_name) {
        const l_count = await db.location.count({
          where: {
            location_name: req.body.location_name
          }
        });
        if (l_count > 0) {
          errors.push({ msg: 'Location with Particular Name Already Exist' });
        }
      }

      if (errors.length == 0) {
        await db.location.update(params, {
          where: {
            location_id: lid
          }
        });

        req.flash('alerts1', 'location Updated Successfully');
        res.redirect('/supervisor/lmodify/0');
      } else {
        const location = await db.location.findOne({
          where: {
            location_id: lid
          }
        });

        res.render('../views/supervisor/updatelocation', { location, success, errors, alertsm: "" });
      }
    } else {
      const location = await db.location.findOne({
        where: {
          location_id: lid
        }
      });

      res.render('../views/supervisor/updatelocation', { location, success, errors, alertsm: "" });
    }
  } catch (err) {
    console.log(err);
  }
}

//Delete Location
const delete_location = async function (req, res) {
  var lid = req.params.lid;
  var errors = [];
  try {
    if (errors.length < 1) {
      await db.location.destroy({
        where: {
          location_id: lid
        }
      });

      req.flash('alerts1', 'Location Deleted Successfully');
      res.redirect('/supervisor/lmodify/0');
    } else {
      res.redirect('/supervisor/lmodify/0');
    }
  } catch (err) {
    console.log(err);
  }
}

function dateconversion(date_value)
{
 var formattedDate = date_value.toLocaleDateString('en-GB', {
 day: 'numeric', month: 'short', year: 'numeric'
  }).replace(/ /g, '-');
  return formattedDate;
}


module.exports = {
  guard_password_reset, enable_guard, disable_guard, delete_guard, guard_register_get, isAuthenticated, guard_save, guard_manage, update_guard1, 
  update_guard2, checkpoint_save, checkpoint_register_get, checkpoint_manage, update_checkpoint1, update_checkpoint2, delete_checkpoint,
  patrol_register_get, patrol_save, patrol_manage, update_patrol1, update_patrol2, delete_patrol, gallocation_get,
  asave, gmodify_get, gmodify_save, preport_get, pgenerate, report_patrol, pusers_get, dashboard_get, dpreport_generate,
  location_register_get, location_save, location_manage, update_location1, update_location2, delete_location
};