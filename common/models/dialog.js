var loopback = require('loopback');
var app = require('./../../server/server');
var async = require('async');
var _ = require('lodash');

/**
 * @class Dialog
 * @inherits {PersistedModel}
 * @param Dialog
 */
module.exports = function(Dialog) {
  Dialog.disableRemoteMethod('create', true);
  Dialog.disableRemoteMethod('update', true);
  Dialog.disableRemoteMethod('updateOne', true);
  Dialog.disableRemoteMethod('deleteById', true);
  Dialog.disableRemoteMethod('deleteOne', true);
  Dialog.disableRemoteMethod('updateAll', true);
  Dialog.disableRemoteMethod('exists', true);
  Dialog.disableRemoteMethod('find', true);
  Dialog.disableRemoteMethod('findOne', true);
  Dialog.disableRemoteMethod('count', true);
  Dialog.disableRemoteMethod('upsert', true);

  Dialog.disableRemoteMethod('__create__messages', false);
  Dialog.disableRemoteMethod('__delete__messages', false);
  Dialog.disableRemoteMethod('__link__messages', false);
  Dialog.disableRemoteMethod('__unlink__messages', false);
  Dialog.disableRemoteMethod('__updateById__messages', false);

  Dialog.disableRemoteMethod('__get__private_participant_1', false);
  Dialog.disableRemoteMethod('__get__private_participant_2', false);

  //Dialog.disableRemoteMethod('__get__users', false);
  Dialog.disableRemoteMethod('__create__users', false);
  Dialog.disableRemoteMethod('__delete__users', false);
  Dialog.disableRemoteMethod('__findById__users', false);
  Dialog.disableRemoteMethod('__count__users', false);
  Dialog.disableRemoteMethod('__destroyById__users', false);
  Dialog.disableRemoteMethod('__deleteById__users', false);
  Dialog.disableRemoteMethod('__exists__users', false);
  Dialog.disableRemoteMethod('__findOne__users', false);
  //Dialog.disableRemoteMethod('__link__users', false);
  //Dialog.disableRemoteMethod('__unlink__users', false);
  Dialog.disableRemoteMethod('__updateById__users', false);

  Dialog.beforeCreate = function(next, modelInstance) {
    modelInstance.created = Date.now();
    modelInstance.updated = Date.now();
    next();
  };

  Dialog.beforeUpdate = function(next, modelInstance) {
    modelInstance.updated = Date.now();
    next();
  };

  Dialog.prototype.populate = function(cb) {
    // this can be user-specific
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    var modelInstance = this;

    async.series([
      function(cb) {
        if(!(currentUser instanceof app.models.user)) {
          return cb();
        }
        app.models.dialogUser.findOne({ where: { dialog_id: modelInstance.id, user_id: currentUser.id }}, function(err, dialogUser) {

          if(!dialogUser) {
            modelInstance.dnd_start = null;
            modelInstance.dnd_life_time = 0;
            return cb();
          }

          //TODO job
          modelInstance.dnd_start = dialogUser.dnd_start;
          modelInstance.dnd_life_time = dialogUser.dnd_life_time;
          return cb();
        });
      },
      function(cb) {
        app.models.message.findOne({ where: {dialog_id: modelInstance.id}, order:'created ASC'}, function(err, message) {
          modelInstance.last_message = message;
          return cb();
        });
      }
    ], function(err) {
      cb();
    });
  };

  Dialog.afterRemote('findById', function(ctx, dialog, next) {
    if(!dialog || !dialog.id) {
      dialog.last_message = null;
      return next();
    }

    return dialog.populate(next);
  });

  Dialog.afterRemote('findById', function(ctx, dialog, next) {
    if(!dialog || !dialog.id) {
      dialog.last_message = null;
      return next();
    }

    return dialog.populate(next);
  });

  Dialog.prototype.setDND = function(dnd, cb) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    var modelInstance = this;
    app.models.dialogUser.findOne({ where: { dialog_id: modelInstance.id, user_id: currentUser.id }}, function(err, dialogUser) {

      if(!dialogUser) {
        return cb();
      }

      //TODO job
      dialogUser.dnd_start = dnd.dnd_start;
      dialogUser.dnd_life_time = dnd.dnd_life_time;
      dialogUser.save(cb);
    });
  };

  Dialog.remoteMethod('setDND', {
    isStatic:false,
    description: 'Changes dialog \'Do not disturb\' settings for registered user',
    accepts: [
      {arg: 'data', type: "dndModeModel", required: true, http: {source: 'body'}}
    ],
    returns: {
      arg: 'dialog', type: 'dialog', root: true
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/set_dnd_mode'}
  });

};
