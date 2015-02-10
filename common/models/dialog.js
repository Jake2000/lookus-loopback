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
  Dialog.disableRemoteMethod('__destroyById__messages', false);
  Dialog.disableRemoteMethod('__deleteById__messages', false);
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
    var modelInstance = this;
    app.models.message.findOne({ where: {dialog_id: modelInstance.id}, order:'created ASC'}, function(err, message) {
      modelInstance.last_message = message;
      return cb();
    });
  };

  Dialog.afterRemote('findById', function(ctx, dialog, next) {
    if(!dialog || !dialog.id) {
      dialog.last_message = null;
      return next();
    }

    return dialog.populate(next);
  });

  Dialog.afterRemote('*.__get__dialogs', function(ctx, dialogs, next) {
    console.log('AAAA');
    next();
  });

  Dialog.afterRemote('findById', function(ctx, dialog, next) {
    if(!dialog || !dialog.id) {
      dialog.last_message = null;
      return next();
    }

    return dialog.populate(next);
  });

};
