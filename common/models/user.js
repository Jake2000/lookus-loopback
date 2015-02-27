var debug = require('debug')('lookus:user');
var app = require('./../../server/server');
var loopback = require('loopback');
var _ = require('lodash');
var async = require('async');

module.exports = function(User) {

  User.login.shared = false;
  User.resetPassword.shared = false;

  //User.disableRemoteMethod('login', true);
  User.disableRemoteMethod('upsert', true);
  User.disableRemoteMethod('updateAll', true);
  User.disableRemoteMethod('exists', true);
  User.disableRemoteMethod('findOne', true);
  User.disableRemoteMethod('count', true);
  User.disableRemoteMethod('find', true);

  User.disableRemoteMethod('__get__friendsContainer', false);

  User.disableRemoteMethod('__get__dialogs', false);
  //User.disableRemoteMethod('__create__dialogs', false);
  User.disableRemoteMethod('__delete__dialogs', false);
  User.disableRemoteMethod('__findById__dialogs', false);
  User.disableRemoteMethod('__count__dialogs', false);
  //User.disableRemoteMethod('__destroyById__dialogs', false);
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

  User.disableRemoteMethod('__get__credentials', false);
  User.disableRemoteMethod('__create__credentials', false);
  User.disableRemoteMethod('__delete__credentials', false);
  User.disableRemoteMethod('__findById__credentials', false);
  User.disableRemoteMethod('__count__credentials', false);
  User.disableRemoteMethod('__destroyById__credentials', false);
  User.disableRemoteMethod('__deleteById__credentials', false);
  User.disableRemoteMethod('__exists__credentials', false);
  User.disableRemoteMethod('__findOne__credentials', false);
  User.disableRemoteMethod('__link__credentials', false);
  User.disableRemoteMethod('__unlink__credentials', false);
  User.disableRemoteMethod('__updateById__credentials', false);

  User.disableRemoteMethod('__get__identities', false);
  User.disableRemoteMethod('__create__identities', false);
  User.disableRemoteMethod('__delete__identities', false);
  User.disableRemoteMethod('__findById__identities', false);
  User.disableRemoteMethod('__count__identities', false);
  User.disableRemoteMethod('__destroyById__identities', false);
  User.disableRemoteMethod('__deleteById__identities', false);
  User.disableRemoteMethod('__exists__identities', false);
  User.disableRemoteMethod('__findOne__identities', false);
  User.disableRemoteMethod('__link__identities', false);
  User.disableRemoteMethod('__unlink__identities', false);
  User.disableRemoteMethod('__updateById__identities', false);

  User.disableRemoteMethod('__create__settings', false);
  User.disableRemoteMethod('__destroy__settings', false);
  User.disableRemoteMethod('__update__settings', false);

  User.beforeRemote('prototype.__destroyById__dialogs', function (ctx, modelInstance, next) {


    next();
  });


  User.prototype.isAdmin = function (cb) {
    app.models.Role.isInRole('admin', {
      principalType: app.models.RoleMapping.USER,
      principalId: this.id
    }, function (err, exists) {
      if (exists) {
        return cb(null, true);
      }

      return cb(null, false);
    });
  };

  User.findByCredentials = function (credentials, fn) {
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
      'findByCredentials' +
      ':email:' + query.email +
      ':username' + query.username +
      ':realm:' + query.realm;
    self.remember(cacheKey, function (cb) {
      self.findOne({where: query}, cb);
    }, fn);
  };

  User.findById = function (uid, fn) {
    var self = this;

    var cacheKey =
      'user:findById' +
      ':id:' + uid;
    self.remember(cacheKey, function (cb) {
      self.findOne({where: {id: uid}}, cb)
    }, fn);
  };

  User.count = function (uid, fn) {
    var self = this;

    var cacheKey =
      'user:count' +
      ':id:' + uid;
    self.remember(cacheKey, function (cb) {
      self.super_.count({where: {id: uid}}, cb)
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
  User.login = function (credentials, include, fn) {
    var self = this;
    if (_.isFunction(include))
      fn = include;
    self.findByCredentials(credentials, function (err, user) {
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
        user.hasPassword(credentials.password, function (err, isMatch) {
          if (err) {
            debug('An error is reported from User.hasPassword: %j', err);
            fn(defaultError);
          } else if (isMatch) {
            user.createAccessToken(credentials.ttl, function (err, token) {
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

  User.remoteMethod('resetPassword', {
    description: 'Reset password for a user with email',
    accepts: [
      {arg: 'options', type: "email", required: true, http: {source: 'body'}}
    ],
    http: {verb: 'post', path: '/reset'}
  });

  /**
   * Confirm the user's identity.
   *
   * @param {Any} uid
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
  User.confirm = function (uid, token, redirect, fn) {
    this.findById(uid, function (err, user) {
      if (err) {
        fn(err);
      } else {
        if (user && user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          user.save(function (err) {
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

  User.beforeCreate = function (next, modelInstance) {
    modelInstance.created = new Date();
    modelInstance.updated = new Date();
    next();
  };

  User.beforeUpdate = function (next, modelInstance) {
    modelInstance.updated = new Date();
    next();
  };

  User.afterCreate = function (next) {
    var modelInstance = this;

    async.series([
      function (cb) {
        app.models.subscriptionContainer.create({
          user_id: modelInstance.id.toString()
        }, function (err, subscriptionContainer) {
          cb();
        });
      },
      function (cb) {
        app.models.friendsContainer.create({
          user_id: modelInstance.id.toString()
        }, function (err, friendsContainer) {
          cb();
        });
      },
      function (cb) {
        app.models.blacklist.create({
          user_id: modelInstance.id.toString()
        }, function (err, blacklist) {
          cb();
        });
      },
      function (cb) {
        app.models.settings.create({
          push_notifications_enable: true,
          push_notifications_only_from_friends: false,
          app_sound_enabled: true,
          user_id: modelInstance.id.toString()
        }, function (err, settings) {
          cb();
        });
      }
    ], function (err) {
      next();
    });
  };

  User.prototype.__set__settings = function (data, cb) {
    app.models.settings.findOne({where: {user_id: this.id}}, function (err, settings) {

      if (err) {
        return cb(err);
      }

      if (!settings) {
        var err1 = new Error("Settings not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      settings.updateAttributes(data, function (err, settings) {
        if (err) {
          return cb(err);
        }
        cb(null, settings);
      });
    });
  };

  User.remoteMethod('__set__settings', {
    isStatic: false,
    description: 'Update user settings',
    accepts: [
      {arg: 'data', type: "settingsModelEditable", required: true, http: {source: 'body'}}
    ],
    returns: {
      arg: 'settings', type: 'settings', root: true,
      description: 'The response body contains properties of user settings.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/settings'}
  });

  User.beforeRemote('prototype.__set__settings', function (ctx, modelInstance, next) {
    next();
  });

  User.beforeRemote('loginVK', function (ctx, modelInstance, next) {
    (function (req, res, next) {
      app.passportConfigurator.getCallbacks('vkontakte-login').authCallback(req, res, next);
    })(ctx.req, ctx.res, next);
  });

  User.beforeRemote('loginVKCallback', function (ctx, modelInstance, next) {
    (function (req, res, next) {
      app.passportConfigurator.getCallbacks('vkontakte-login').finishCallback(req, res, next);
    })(ctx.req, ctx.res, next);
  });

  User.beforeRemote('loginFB', function (ctx, modelInstance, next) {
    (function (req, res, next) {
      app.passportConfigurator.getCallbacks('facebook-login').authCallback(req, res, next);
    })(ctx.req, ctx.res, next);
  });

  User.beforeRemote('loginFBCallback', function (ctx, modelInstance, next) {
    (function (req, res, next) {
      app.passportConfigurator.getCallbacks('facebook-login').finishCallback(req, res, next);
    })(ctx.req, ctx.res, next);
  });

  User.loginVK = function (cb) {
    // Empty method for vk auth
    cb(null);
  };

  User.loginVKCallback = function (cb) {
    // Empty method for vk auth callback
    cb(null);
  };

  User.loginFB = function (cb) {
    // Empty method for fb auth
    cb(null);
  };

  User.loginFBCallback = function (cb) {
    // Empty method for fb auth callback
    cb(null);
  };

  User.remoteMethod('loginVKCallback', {
    description: 'Vkontakte login callback',
    accepts: [
      {arg: 'code', type: 'string', required: true}
    ],
    returns: {
      arg: 'accessToken', type: 'AccessToken', root: true,
      description: 'The response body contains properties of the AccessToken created on login.\n'
    },
    notes: 'Сюда приходит коллбэк из vk.auth.com. <br>',
    http: {verb: 'get', path: '/login/vk/callback'}
  });
  //
  User.remoteMethod('loginVK', {
    description: 'Login with Vkontakte',
    accepts: [],
    notes: 'URL Для авторизации пользователя через ВК<br>' +
    'При переходе на этот url происходит 302 редирект на oauth.vk.com ' +
    'и вконтакте отдает html страницу с формой для подтверждения доверия этому приложению. <br>' +
    'Как только пользователь подтверждает доверие, то происходит редирект на login.vk.com. <br>' +
    'А затем, редирект на \'/api/users/login/vk/callback\?code=<код>\'<br>' +
    '<br><br>' +
    '<b>ВНИМАНИЕ</b>: Для правильной работы необходимо проставить правильный домен (текущий)<br>' +
    'в настройках API для приложения Вконтакте' +
    '<br><br>' +
    '<b>ВНИМАНИЕ</b>: Этот URL не будет работать через API Explorer.<br>' +
    'Чтобы увидеть работу данного функционала нужно перейти по <a href="/">ссылке</a>',
    http: {verb: 'get', path: '/login/vk'}
  });

  User.remoteMethod('loginFBCallback', {
    description: 'Facebook login callback',
    accepts: [],
    notes: 'Сюда приходит коллбэк из Facebook',
    http: {verb: 'get', path: '/login/fb/callback'}
  });

  User.remoteMethod('loginFB', {
    description: 'Login with Facebook',
    accepts: [],
    notes: 'URL Для авторизации пользователя через FB<br>' +
    'При переходе на этот url происходит 302 редирект на https://www.facebook.com/dialog/oauth ' +
    'и facebook отдает html страницу с формой для подтверждения доверия этому приложению. <br>' +
    'Как только пользователь подтверждает доверие, то происходит редирект на \'/api/users/login/fb/callback\?code=<код>\'<br>' +
    '<br><br>' +
    '<b>ВНИМАНИЕ</b>: Для правильной работы необходимо проставить правильный домен (текущий)<br>' +
    'в настройках API для приложения Facebook' +
    '<br><br>' +
    '<b>ВНИМАНИЕ</b>: Этот URL не будет работать через API Explorer.<br>' +
    'Чтобы увидеть работу данного функционала нужно перейти по <a href="/">ссылке</a>',
    http: {verb: 'get', path: '/login/fb'}
  });

  User.current = function (cb) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if (!currentUser) {
      var err = new Error('Access Exception');
      err.status = 403;
      err.errorCode = 40301;
      return next(err);
    }

    cb(null, currentUser);
  };

  User.remoteMethod('current', {
    description: 'Get current authenticated user',
    accepts: [],
    returns: {
      arg: 'user', type: 'user', root: true,
      description: 'The response body contains properties of user.\n'
    },
    notes: 'Возвращает данные текущего аутентифицированного пользователя',
    http: {verb: 'get', path: '/current'}
  });

  User.prototype.__get__friends = function (fields, queryText, offset, limit, cb) {
    app.models.friendsContainer.findOne({where: {user_id: this.id}}, function (err, friendsContainer) {

      if (err) {
        return cb(err);
      }

      if (!friendsContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.friendsContainerUser.find({
        where: {friendsContainer_id: friendsContainer.id}
      }, function (err, userContainers) {
        if (err) {
          return cb(err);
        }

        var ids = [];
        _.forEach(userContainers, function (userContainer) {
          ids.push(userContainer.user_id);
        });

        var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['first_name', 'last_name']);
        query.where = query.where || {};
        query.where.id = {inq: ids};
        app.models.user.find(query, function (err, users) {
          return cb(null, users);
        });
      });
    });
  };

  User.remoteMethod('__get__friends', {
    isStatic: false,
    description: 'Query user friends',
    accepts: [
      {
        arg: 'fields',
        type: 'string',
        description: 'Field names (field1,field2)',
        required: false,
        http: {source: 'query'}
      },
      {arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      {
        arg: 'offset',
        type: 'integer',
        description: 'Offset (for pagination), default = 0',
        required: false,
        http: {source: 'query'}
      },
      {
        arg: 'limit',
        type: 'integer',
        description: 'Limit (for pagination), default = 50',
        required: false,
        http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'users', type: ["user"], root: true,
      description: 'The response body contains list of users\'s friends.\n'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/friends'}
  });

  User.prototype.__link__friends = function (friendId, cb) {
    app.models.friendsContainer.findOne({where: {user_id: this.id}}, function (err, friendsContainer) {

      if (err) {
        return cb(err);
      }

      if (!friendsContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(friendId, function (err, friend) {

        if (err) {
          return cb(err);
        }

        if (!friend) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.friendsContainerUser.findOrCreate(
          {
            where: {
              friendsContainer_id: friendsContainer.id,
              user_id: friend.id
            }
          }, {
            friendsContainer_id: friendsContainer.id,
            user_id: friend.id
          }, function (err, ok) {
            cb(err, {success: true});
          });
      });

    });
  };

  User.prototype.__unlink__friends = function (friendId, cb) {
    app.models.friendsContainer.findOne({where: {user_id: this.id}}, function (err, friendsContainer) {

      if (err) {
        return cb(err);
      }

      if (!friendsContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(friendId, function (err, friend) {

        if (err) {
          return cb(err);
        }

        if (!friend) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.friendsContainerUser.remove({
          friendsContainer_id: friendsContainer.id,
          user_id: friend.id
        }, function (err, ok) {
          cb(err, {success: true});
        });
      });

    });
  };

  User.remoteMethod('__link__friends', {
    isStatic: false,
    description: 'Add user friend',
    accepts: [
      {arg: 'subscription_user_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/friends/rel/:subscription_user_id'}
  });

  User.remoteMethod('__unlink__friends', {
    isStatic: false,
    description: 'Remove user friend',
    accepts: [
      {arg: 'subscription_user_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'delete', path: '/friends/rel/:subscription_user_id'}
  });

  User.beforeRemote('prototype.uploadAvatar', function (ctx, modelInstance, next) {
    ctx.req.params.container = 'user-avatars';
    app.models.container.upload(ctx.req, ctx.res, function (err, result) {
      var ctx = loopback.getCurrentContext();
      ctx.set("filename", result.files.image[0].name);
      next();
    });
  });

  User.prototype.uploadAvatar = function (image, cb) {
    var ctx = loopback.getCurrentContext();
    this.image_url = '/uploads/user-avatars/' + ctx.get('filename');
    this.save(function (err, user) {
      cb(err, user);
    });
  };

  User.remoteMethod('uploadAvatar', {
    isStatic: false,
    description: 'Upload avatar',
    accepts: [
      {arg: 'image', type: "File", required: true, http: {source: 'body'}}
    ],
    returns: {
      arg: 'user', type: 'user', root: true
    },
    accessType: 'WRITE',
    http: {verb: 'post', path: '/uploadAvatar'}
  });

  User.afterRemote('prototype.__get__dialogs', function (ctx, dialogs, next) {
    async.eachSeries(dialogs, function (dialog, cb) {
      dialog.populate(cb);
    }, function (err) {
      //ctx.result = {'dialogs': dialogs};
      next();
    });
  });

  User.prototype.__get__blacklist = function (fields, queryText, offset, limit, cb) {
    app.models.blacklist.findOne({where: {user_id: this.id}}, function (err, blacklist) {

      if (err) {
        return cb(err);
      }

      if (!blacklist) {
        var err1 = new Error("Blacklist not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.blacklistUser.find({
        where: {blacklist_id: blacklist.id}
      }, function (err, usercontainers) {
        if (err) {
          return cb(err);
        }

        var ids = [];
        _.forEach(usercontainers, function (usercontainer) {
          ids.push(usercontainer.user_id);
        });

        var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['first_name', 'last_name']);
        query.where = query.where || {};
        query.where.id = {inq: ids};
        app.models.user.find(query, function (err, users) {
          return cb(null, users);
        });
      });
    });
  };

  User.remoteMethod('__get__blacklist', {
    isStatic: false,
    description: 'Query blacklisted friends',
    accepts: [
      {
        arg: 'fields',
        type: 'string',
        description: 'Field names (field1,field2)',
        required: false,
        http: {source: 'query'}
      },
      {arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      {
        arg: 'offset',
        type: 'integer',
        description: 'Offset (for pagination), default = 0',
        required: false,
        http: {source: 'query'}
      },
      {
        arg: 'limit',
        type: 'integer',
        description: 'Limit (for pagination), default = 50',
        required: false,
        http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'users', type: ["user"], root: true,
      description: 'The response body contains list of users in blacklist.\n'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/blacklist'}
  });

  User.prototype.__link__blacklistUser = function (blacklistedUserId, cb) {
    app.models.blacklist.findOne({where: {user_id: this.id}}, function (err, blacklist) {

      if (err) {
        return cb(err);
      }

      if (!blacklist) {
        var err1 = new Error("Blacklist not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(blacklistedUserId, function (err, blacklistedUser) {

        if (err) {
          return cb(err);
        }

        if (!blacklistedUser) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.blacklistUser.findOrCreate(
          {
            where: {
              blacklist_id: blacklist.id,
              user_id: blacklistedUser.id
            }
          }, {
            blacklist_id: blacklist.id,
            user_id: blacklistedUser.id
          }, function (err, ok) {
            cb(null, {success: true});
          });
      });

    });
  };

  User.prototype.__unlink__blacklistUser = function (blacklistedUserId, cb) {
    app.models.blacklist.findOne({where: {user_id: this.id}}, function (err, blacklist) {

      if (err) {
        return cb(err);
      }

      if (!blacklist) {
        var err1 = new Error("Blacklist not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(blacklistedUserId, function (err, blacklistedUser) {

        if (err) {
          return cb(err);
        }

        if (!blacklistedUser) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.blacklistUser.remove({
          blacklist_id: blacklist.id,
          user_id: blacklistedUser.id
        }, function (err, ok) {
          cb(null, {success: true});
        });
      });

    });
  };

  User.remoteMethod('__link__blacklistUser', {
    isStatic: false,
    description: 'Add user to blacklist',
    accepts: [
      {arg: 'blacklisted_user_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/blacklist/rel/:blacklisted_user_id'}
  });

  User.remoteMethod('__unlink__blacklistUser', {
    isStatic: false,
    description: 'Remove user from blacklist',
    accepts: [
      {arg: 'blacklisted_user_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'delete', path: '/blacklist/rel/:blacklisted_user_id'}
  });

  User.prototype.__get__active__markers = function (filter, cb) {
    app.models.marker.findActiveForUser(this, filter, cb);
  };

  User.prototype.__get__marker__history = function (fields, queryText, offset, limit, cb) {
    var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['text']);
    query.where = query.where || {};
    app.models.marker.findInactiveForUser(this, query, cb);
  };

  User.remoteMethod('__get__marker__history', {
    isStatic: false,
    description: 'Get markers history for user (all inactive markers)',
    accepts: [
      {
        arg: 'fields',
        type: 'string',
        description: 'Field names (field1,field2)',
        required: false,
        http: {source: 'query'}
      },
      {arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      {
        arg: 'offset',
        type: 'integer',
        description: 'Offset (for pagination), default = 0',
        required: false,
        http: {source: 'query'}
      },
      {
        arg: 'limit',
        type: 'integer',
        description: 'Limit (for pagination), default = 50',
        required: false,
        http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'markers', type: ['marker'], root: true,
      description: 'Array of markers'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/markers/history'}
  });

  User.remoteMethod('__get__active__markers', {
    isStatic: false,
    description: 'Get markers for user (all active markers)',
    accepts: [
      {
        arg: 'filter', type: 'string', description: 'Filter defining fields, where, orderBy, offset, and limit',
        required: false, http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'markers', type: ['marker'], root: true,
      description: 'Array of markers'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/markers'}
  });

  User.afterInitialize = function () {
    // your logic goes here
  };

  Object.defineProperty(User.prototype, 'is_online', {
    get: function () {
      return true;
    }
  });

  Object.defineProperty(User.prototype, 'is_friend', {
    get: function () {


      return false;
    }
  });

  //subscriptions
  User.prototype.__get__subscription = function (fields, queryText, offset, limit, cb) {
    app.models.subscriptionContainer.findOne({where: {user_id: this.id}}, function (err, subscriptionContainer) {

      if (err) {
        return cb(err);
      }

      if (!subscriptionContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.subscriptionContainerUser.find({
        where: {subscriptionContainer_id: subscriptionContainer.id}
      }, function (err, userContainers) {
        if (err) {
          return cb(err);
        }

        var ids = [];
        _.forEach(userContainers, function (userContainer) {
          ids.push(userContainer.user_id);
        });

        var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['first_name', 'last_name']);
        query.where = query.where || {};
        query.where.id = {inq: ids};
        app.models.user.find(query, function (err, users) {
          return cb(null, users);
        });
      });
    });
  };

  User.remoteMethod('__get__subscription', {
    isStatic: false,
    description: 'Query user subscriptions',
    accepts: [
      {
        arg: 'fields',
        type: 'string',
        description: 'Field names (field1,field2)',
        required: false,
        http: {source: 'query'}
      },
      {arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      {
        arg: 'offset',
        type: 'integer',
        description: 'Offset (for pagination), default = 0',
        required: false,
        http: {source: 'query'}
      },
      {
        arg: 'limit',
        type: 'integer',
        description: 'Limit (for pagination), default = 50',
        required: false,
        http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'users', type: ["user"], root: true,
      description: 'The response body contains list of users\'s subscription.\n'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/subscriptions'}
  });

  User.prototype.__link__subscription = function (friendId, cb) {
    app.models.subscriptionContainer.findOne({where: {user_id: this.id}}, function (err, subscriptionContainer) {

      if (err) {
        return cb(err);
      }

      if (!subscriptionContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(friendId, function (err, friend) {

        if (err) {
          return cb(err);
        }

        if (!friend) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.subscriptionContainerUser.findOrCreate(
          {
            where: {
              subscriptionContainer_id: subscriptionContainer.id,
              user_id: friend.id
            }
          }, {
            subscriptionContainer_id: subscriptionContainer.id,
            user_id: friend.id
          }, function (err, ok) {
            cb(err, {success: true});
          });
      });

    });
  };

  User.prototype.__unlink__subscription = function (friendId, cb) {
    app.models.subscriptionContainer.findOne({where: {user_id: this.id}}, function (err, subscriptionContainer) {

      if (err) {
        return cb(err);
      }

      if (!subscriptionContainer) {
        var err1 = new Error("FriendContainer not found");
        err1.status = 404;
        err1.errorCode = 40401;
        return cb(err1);
      }

      app.models.user.findById(friendId, function (err, friend) {

        if (err) {
          return cb(err);
        }

        if (!friend) {
          var err2 = new Error("User with this id not found");
          err2.status = 404;
          err2.errorCode = 40401;
          return cb(err2);
        }

        app.models.subscriptionContainerUser.remove({
          subscriptionContainer_id: subscriptionContainer.id,
          user_id: friend.id
        }, function (err, ok) {
          cb(err, {success: true});
        });
      });

    });
  };

  User.remoteMethod('__link__subscription', {
    isStatic: false,
    description: 'Add user subscription',
    accepts: [
      {arg: 'subscription_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/subscriptions/rel/:subscription_id'}
  });

  User.remoteMethod('__unlink__subscription', {
    isStatic: false,
    description: 'Remove user subscription',
    accepts: [
      {arg: 'subscription_id', type: 'any', description: 'User id', required: true, http: {source: 'path'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success json.\n'
    },
    accessType: 'WRITE',
    http: {verb: 'delete', path: '/subscriptions/rel/:subscription_id'}
  });

  User.findEx = function (fields, queryText, offset, limit, cb) {
    var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['first_name', 'last_name']);
    User.find(query, cb);
  };

  User.remoteMethod('findEx', {
    description: 'Query users',
    accepts: [
      {
        arg: 'fields',
        type: 'string',
        description: 'Field names (field1,field2)',
        required: false,
        http: {source: 'query'}
      },
      {arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      {
        arg: 'offset',
        type: 'integer',
        description: 'Offset (for pagination), default = 0',
        required: false,
        http: {source: 'query'}
      },
      {
        arg: 'limit',
        type: 'integer',
        description: 'Limit (for pagination), default = 50',
        required: false,
        http: {source: 'query'}
      }
    ],
    returns: {
      arg: 'users', type: ['user'], root: true,
      description: 'Users array.\n'
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/'}
  });

  User.prototype.__get__dialogs__ex = function (fields, queryText, offset, limit, cb) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    var query = app.query.formatSearchQuery(fields, queryText, offset, limit, ['title']);
    query.where = query.where || {};
    query.where.deleted_by = {neq: currentUser.id.toString()};

    User.prototype.__get__dialogs.call(this, query, cb);
  };

  User.remoteMethod('__get__dialogs__ex', {
    isStatic: false,
    description: 'Query user\'s dialogs',
    accepts: [
      { arg: 'fields', type: 'string', description: 'Field names (field1,field2)', required: false, http: {source: 'query'}},
      { arg: 'query', type: 'string', description: 'Search by text', required: false, http: {source: 'query'}},
      { arg: 'offset', type: 'integer', description: 'Offset (for pagination), default = 0', required: false, http: {source: 'query'}},
      { arg: 'limit', type: 'integer', description: 'Limit (for pagination), default = 50', required: false, http: {source: 'query'}}
    ],
    returns: {
      arg: 'dialogs', type: ['dialogModelExtended'], root: true,
      description: 'Array of dialogs.\n'
    },
    accessType: 'READ',
    http: { verb: 'get', path: '/dialogs' }
  });

  User.prototype.__update__push__token = function(device, pushToken, cb) {
    if(!(device == 'ios' || device == 'android')) {
      var err = new Error('Wrong device type');
      err.statucCode = 422;
      return cb(err);
    }

    if(device == 'android') {
      this.push_token_android = pushToken;
    } else if (device == 'ios') {
      this.push_token_ios = pushToken;
    }

    this.save(cb);
  };

  User.remoteMethod('__update__push__token', {
    isStatic: false,
    description: 'Sets push token for a user',
    accepts: [
      { arg: 'device', type: 'string', description: 'Device type (ios, android)', required: false, http: {source: 'query'}},
      { arg: 'push_token', type: 'string', description: 'Push token', required: false, http: {source: 'query'}}
    ],
    returns: {
      arg: 'success', type: 'successModel', root: true,
      description: 'Success.\n'
    },
    accessType: 'WRITE',
    http: { verb: 'put', path: '/push_token' }
  });
};
