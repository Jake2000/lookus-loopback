var debug = require('debug')('boot:add-cache');
var _ = require('lodash');

module.exports = function(app) {
  console.log('custom find');
  //_.forEach(_.keys(app.loopback.), function(key) {
  //  console.log(key);
  //});

  //var PersistedModel = app.loopback.PersistedModel;
  //
  //PersistedModel.prototype.remember = function(key, fn, cb) {
  //  //TODO caching
  //  fn(function (err, res) {
  //    cb(err,res);
  //  });
  //};
  //
  //PersistedModel.prototype.forget = function(key, fn, cb) {
  //  //TODO caching
  //};
  //var dialog = app.models.dialog;
  //var find = dialog.find;
  //
  //dialog.find = function(filter, cb) {
  //  console.log('custom find');
  //  filter = filter || {};
  //  filter.include = ['messages', 'users'];
  //  find.call(dialog, filter, cb);
  //};
};
