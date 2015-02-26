var debug = require('debug')('boot:create-dialog-overrides');
var _ = require('lodash');


//var wrap = function(functionName, obj, wrapper) {
//  var fn = obj['functionName'];
//
//  obj['functionName'] = function() {
//    var args = Array.prototype.slice.call(arguments);
//
//    wrapper.apply.
//
//    fn.apply(this, args);
//  };
//};

module.exports = function(app) {
  var loopback = app.loopback;
  var User = app.models.user;
  var Dialog = app.models.dialog;
  var Message = app.models.message;

  app.remotes().findMethod('dialog.prototype.updateAttributes').accepts = [
    {arg: 'data', type: 'dialogModelEditable', required: true, http: {source: 'body'}}
  ];

  app.remotes().findMethod('user.prototype.__create__dialogs').accepts = [
    {arg: 'data', type: 'dialogModelEditable', required: true, http: {source: 'body'}}
  ];

  app.remotes().findMethod('dialog.findById').returns = [
    {arg: 'dialog', type: 'dialogModelExtended', root: true}
  ];

  var tmpFunction = Dialog.prototype.__get__messages;
  Dialog.prototype.__get__messages = function(filter, cb) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.deleted_by = {neq: currentUser.id.toString()};

    tmpFunction.call(this, filter, cb);
  };

  Dialog.prototype.__destroyById__messages = function(messageId, cb) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    this.messages.findById(messageId, function(err, message) {
      if(err) { return cb(err); }

      if(!message) {
        var err1 = new Error('Message not found');
        err1.statusCode = 404;
        return cb(err1);
      }

      message.markAsDeleted(currentUser.id, function(err, msg) {
        cb(null, 204);
      });
    });
  };

};
