var debug = require('debug')('boot:create-user-overrides');
var _ = require('lodash');

module.exports = function(app) {
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


  app.remotes().findMethod('user.create').accepts = [{arg: 'data', type: 'userModelEditable', http: {source: 'body'}}];


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

};
