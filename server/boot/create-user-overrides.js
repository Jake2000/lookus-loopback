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

};
