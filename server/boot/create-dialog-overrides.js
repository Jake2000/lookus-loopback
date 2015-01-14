var debug = require('debug')('boot:create-dialog-overrides');
var _ = require('lodash');

module.exports = function(app) {
  var User = app.models.user;
  var Dialog = app.models.dialog;


  app.remotes().findMethod('dialog.prototype.updateAttributes').accepts = [
    {arg: 'data', type: 'dialogModelEditable', required: true, http: {source: 'body'}}
  ];

  app.remotes().findMethod('user.prototype.__get__dialogs').returns = [
    {arg: 'dialogs', type: ['dialogModelExtended'], root: true}
  ];

  app.remotes().findMethod('user.prototype.__create__dialogs').accepts = [
    {arg: 'data', type: 'dialogModelEditable', required: true, http: {source: 'body'}}
  ];

  app.remotes().findMethod('dialog.findById').returns = [
    {arg: 'dialog', type: ['dialogModelExtended'], root: true}
  ];

  var dialog = app.models.dialog;
  var find = dialog.find;

  //dialog.find = function(filter, cb) {
  //  filter = filter || {};
  //  find.call(dialog, filter, function(err, dialogs) {
  //
  //  });
  //};
};
