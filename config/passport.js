const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      db.users.findOne({
        where: {
          email: email,
          status: 'current'
        }
      }).then(user => {
        if (!user) {
          return done(null, false, { msg: 'That email is not registered or account disabled' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.user_id);
  });

  passport.deserializeUser(function (user_id, done) {
    const user = db.users.findByPk(user_id);
    done(null, user);
  });

};
