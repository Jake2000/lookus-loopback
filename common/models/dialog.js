var loopback = require('loopback');
var app = require('./../../server/server');
var async = require('async');
var _ = require('lodash');

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

  Dialog.afterInitializeEvents = {
    addTimestamps:function(next) {
      if (!this.created) {
        this.created = Date.now();
      }
      if (!this.updated) {
        this.updated = Date.now();
      }
      if (next) next();
    },
    includeLastMessage:function(next) {
      if (this.last_message === undefined) {
        this.last_message = {
          body: 'text',
          subject: 'subject'
        };
      }
      if (next) next();
    },
    includeRecipient:function(next) {
      if (this.is_grouped === false) {
        this.recipient = {
          id: 'rcp',
          last_name: 'rcp',
          first_name: "text"
        };
      }
      if (next) next();
    }
  };

  Dialog.afterInitialize = function(next) {
    Dialog.afterInitializeEvents = Dialog.afterInitializeEvents || {};
    var events = [];
    var self = this;
    _.forEach(_.keys(Dialog.afterInitializeEvents), function(key) {
      events.push(Dialog.afterInitializeEvents[key]);
    });

    async.eachSeries(events, function(fn, cb) {
      fn.call(self, cb);
    }, function(err){
      if (next) next();
    });
  };
};
