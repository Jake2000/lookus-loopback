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
  var settingsCtor = app.models.settings.prototype;
  var userIdSetter = Object.getOwnPropertyDescriptor(settingsCtor, "user_id").set;
  Object.defineProperty(settingsCtor, 'user_id', {
    set: function(value) {
      if(!settingsCtor.id)
        userIdSetter.call(settingsCtor, value);
    }
  });

  //var idSetter = Object.getOwnPropertyDescriptor(settingsCtor, "id").set;
  //Object.defineProperty(settingsCtor, 'id', {
  //  set: function(value) {
  //
  //    if (value == undefined && !settingsCtor.id)
  //      if (!!(idSetter && idSetter.constructor && idSetter.call && idSetter.apply)) {
  //        console.log(idSetter);
  //        idSetter.call(settingsCtor, value);
  //      } else {
  //        settingsCtor.$id = value;
  //      }
  //  }
  //});
  //
};
