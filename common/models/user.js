var debug = require('debug')('lookus:user');
var app = require('./../../server/server');

module.exports = function(User) {

  User.login.shared = false;
  User.resetPassword.shared = false;

  User.disableRemoteMethod('upsert', true);
  User.disableRemoteMethod('updateAll', true);
  User.disableRemoteMethod('exists', true);
  User.disableRemoteMethod('findOne', true);
  User.disableRemoteMethod('count', true);
  User.disableRemoteMethod('find', true);

  //User.disableRemoteMethod('__get__dialogs', false);
  //User.disableRemoteMethod('__create__dialogs', false);
  User.disableRemoteMethod('__delete__dialogs', false);
  User.disableRemoteMethod('__findById__dialogs', false);
  User.disableRemoteMethod('__count__dialogs', false);
  User.disableRemoteMethod('__destroyById__dialogs', false);
  User.disableRemoteMethod('__deleteById__dialogs', false);
  User.disableRemoteMethod('__exists__dialogs', false);
  User.disableRemoteMethod('__findOne__dialogs', false);
  User.disableRemoteMethod('__link__dialogs', false);
  User.disableRemoteMethod('__unlink__dialogs', false);
  User.disableRemoteMethod('__updateById__dialogs', false);

  User.disableRemoteMethod('__create__friends', false);
  User.disableRemoteMethod('__delete__friends', false);
  User.disableRemoteMethod('__updateById__friends', false);
  User.disableRemoteMethod('__destroyById__friends', false);
  User.disableRemoteMethod('__findById__friends', false);
  User.disableRemoteMethod('__exists__friends', false);

  User.disableRemoteMethod('__get__owners', false);
  User.disableRemoteMethod('__create__owners', false);
  User.disableRemoteMethod('__delete__owners', false);
  User.disableRemoteMethod('__findById__owners', false);
  User.disableRemoteMethod('__count__owners', false);
  User.disableRemoteMethod('__destroyById__owners', false);
  User.disableRemoteMethod('__deleteById__owners', false);
  User.disableRemoteMethod('__exists__owners', false);
  User.disableRemoteMethod('__findOne__owners', false);
  User.disableRemoteMethod('__link__owners', false);
  User.disableRemoteMethod('__unlink__owners', false);
  User.disableRemoteMethod('__updateById__owners', false);

  User.remember = function(key, fn, cb) {
    //TODO caching
    fn(function (err, res) {
      cb(err,res);
    });
  };

  User.forget = function(key, fn, cb) {
    //TODO caching
  };

  User.findByCredentials = function(credentials, fn) {
    var self = this;

    var realmDelimiter;
    // Check if realm is required
    var realmRequired = !!(self.settings.realmRequired ||
      self.settings.realmDelimiter);
    if (realmRequired) {
      realmDelimiter = self.settings.realmDelimiter;
    }
    var query = self.normalizeCredentials(credentials, realmRequired,
      realmDelimiter);

    if (realmRequired && !query.realm) {
      var err1 = new Error('realm is required');
      err1.statusCode = 400;
      return fn(err1);
    }
    if (!query.email && !query.username) {
      var err2 = new Error('username or email is required');
      err2.statusCode = 400;
      return fn(err2);
    }
    var cacheKey =
      'user:findByCredentials'+
      ':email:' + query.email +
      ':username' + query.username +
      ':realm:' + query.realm;
    self.remember(cacheKey, function(cb) {
      self.findOne({where: query}, cb);
    }, fn);
  };

  User.findById = function(uid, fn) {
      var self = this;

      var cacheKey =
        'user:findById'+
        ':id:' + uid;
      self.remember(cacheKey, function(cb) {
        self.findOne({where: { id: uid}}, cb)
      }, fn);
  };

  User.count = function(uid, fn) {
    var self = this;

    var cacheKey =
      'user:count'+
      ':id:' + uid;
    self.remember(cacheKey, function(cb) {
      self.super_.count({where: { id: uid}}, cb)
    }, fn);
  };

  /**
   * Login a user by with the given `credentials`.
   *
   * ```js
   *    User.login({username: 'foo', password: 'bar'}, function (err, token) {
  *      console.log(token.id);
  *    });
   * ```
   *
   * @param {Object} credentials username/password or email/password
   * @param {Function} fn Callback function
   */
  User.login = function(credentials, fn) {
    var self = this;

    self.findByCredentials(credentials, function(err, user) {
      var defaultError = new Error('login failed');
      defaultError.statusCode = 401;

      if (err) {
        debug('An error is reported from User.findOne: %j', err);
        fn(defaultError);
      } else if (user) {
        if (self.settings.emailVerificationRequired) {
          if (!user.emailVerified) {
            // Fail to log in if email verification is not done yet
            debug('User email has not been verified');
            err = new Error('login failed as the email has not been verified');
            err.statusCode = 401;
            return fn(err);
          }
        }
        user.hasPassword(credentials.password, function(err, isMatch) {
          if (err) {
            debug('An error is reported from User.hasPassword: %j', err);
            fn(defaultError);
          } else if (isMatch) {
            user.createAccessToken(credentials.ttl, function(err, token) {
              if (err) return fn(err);
              token.__data.user = user;
              fn(err, token);
            });
          } else {
            debug('The password is invalid for user %s', credentials.email || credentials.username);
            fn(defaultError);
          }
        });
      } else {
        debug('No matching record is found for user %s', credentials.email || credentials.username);
        fn(defaultError);
      }
    });
  };

  User.remoteMethod(
    'login',
    {
      description: 'Login a user with username/email and password',
      accepts: [
        {arg: 'credentials', type: 'credentials', required: true, http: {source: 'body'}}
      ],
      returns: {
        arg: 'accessToken', type: 'AccessToken', root: true,
        description:
          'The response body contains properties of the AccessToken created on login.\n'
      },
      http: {verb: 'post'}
    }
  );



  User.remoteMethod(
    'resetPassword',
    {
      description: 'Reset password for a user with email',
      accepts: [
        {arg: 'options', type: "email", required: true, http: {source: 'body'}}
      ],
      http: {verb: 'post', path: '/reset'}
    }
  );

  /**
   * Confirm the user's identity.
   *
   * @param {Any} uid
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
  User.confirm = function(uid, token, redirect, fn) {
    this.findById(uid, function(err, user) {
      if (err) {
        fn(err);
      } else {
        if (user && user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          user.save(function(err) {
            if (err) {
              fn(err);
            } else {
              fn();
            }
          });
        } else {
          if (user) {
            err = new Error('Invalid token: ' + token);
            err.statusCode = 400;
          } else {
            err = new Error('User not found: ' + uid);
            err.statusCode = 404;
          }
          fn(err);
        }
      }
    });
  };

  User.afterCreate = function(next) {
    var modelInstance = this;

    app.models.settings.create({
      user_id: modelInstance.id,
      notifications_global_disable: false,
      notifications_only_from_friends: false,
      notifications_no_sound: false
    },function(err, settings) {
      next();
    });
  };

  User.updateSettings = function(settings, cb) {
    cb(null, {i:'not yet implemented'});
  };

  User.remoteMethod('prototype.__update__settings',
    {
      description: 'Update user settings',
      accepts: [
        {arg: 'settings', type: "settings", required: true, http: {source: 'body'}}
      ],
      http: {verb: 'put', path: '/:id/settings'}
    }
  );
};
