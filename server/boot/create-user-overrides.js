var debug = require('debug')('boot:create-user-overrides');
var _ = require('lodash');
var async = require('async');

module.exports = function(app) {
  var loopback = app.loopback;
  var User = app.models.user;

  User.disableRemoteMethod('__create__dialogs');
  User.prototype.__create__dialogs_ex = function() {
    this.__create__dialogs.apply(this, arguments);
  };

  app.loopback.remoteMethod(
    User.prototype.__create__dialogs_ex,
    {
      isStatic: false,
      http: {verb: 'post', path: '/' + 'dialogs'},
      accepts: {arg: 'data', type: 'dialogModelEditable', http: {source: 'body'}},
      description: 'Creates a new instance in ' + 'dialog' + ' of this model.',
      accessType: 'WRITE',
      returns: {arg: 'data', type: 'dialogModelExtended', root: true}
    }
  );

  app.remotes().findMethod('user.create').notes = '' +
  'Регистрация пользователя';

  app.remotes().findMethod('user.create').accepts = [{arg: 'data', type: 'userModelCreatable', http: {source: 'body'}}];

  app.remotes().findMethod('user.login').accepts = [{arg: 'credentials', type: 'credentials', required: true, http: {source: 'body'}}];
  app.remotes().findMethod('user.login').notes = 'Можно логиниться под двумя тестовыми пользователями:<br> ' +
  '1) user1: {email: user1@infloop.ru, password: 123456789} <br>' +
  '2) admin1: {email: admin1@infloop.ru, password: 123456789}' +
  '<br><br>' +
  'При успешном логине возвращается модель AccessToken.<br>' +
  'токеном доступа является ее id';

  app.remotes().findMethod('user.login').returns = [{
    arg: 'accessToken', type: 'AccessToken', root: true,
    description:
      'The response body contains properties of the AccessToken created on login.\n'
  }];

  // updateAttributes
  app.remotes().findMethod('user.prototype.updateAttributes').notes = '' +
  'Редактирование пользователя <br>';

  app.remotes().findMethod('user.prototype.updateAttributes').accepts = [{arg: 'data', type: 'userModelEditable', required: true, http: {source: 'body'}}];
  ;

  User.prototype.__destroyById__dialogs = function(dialogId, cb) {
    var modelInstance = this;

    app.models.dialogUser.findOne({where: {dialog_id: dialogId, user_id: modelInstance.id }}, function(err, dialogUser) {

      if(err) { return cb(err); }

      if(!dialogUser) {
        var err1 = new Error('Dialog not found in user\'s dialogs');
        err1.statusCode = 404;
        return cb(err1);
      }

      app.models.dialog.findById(dialogId, function (err, dialog) {

        if(err) { return cb(err); }

        if(!(dialog instanceof app.models.dialog)) {
          var err2 = new Error('Dialog not found in');
          err2.statusCode = 404;
          return cb(err2);
        }

        if(dialog.is_grouped == true) {
          // If dialog is group dialog - only leave it
          dialogUser.destroy(function(err, res) {
            if(err) { return cb(err); }

            return cb(null, 204);
          });
        } else {
          // If dialog is not a group dialog - update all messages as deleted by this user
          app.models.message.find({ where: {dialog_id: dialogId}}, function(err, messages) {

            async.eachSeries(messages, function(message, cb) {
              message.markAsDeleted(modelInstance.id, cb);
            }, function(err) {
              dialog.markAsDeleted(modelInstance.id, function(err, dialog) {
                return cb(null, 204);
              });
            });
          });
        }
      });
    });
  };
};
