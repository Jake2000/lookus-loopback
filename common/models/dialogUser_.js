var loopback = require('loopback');
var app = require('./../../server/server');
var noop = function() {};

module.exports = function(Dialoguser) {

  Dialoguser.afterSave = function (next) {
    var modelInstance = this;
    // updating dialog users count
    app.models.dialoguser.count({dialog_id: modelInstance.dialog_id}, function (err, count) {
      modelInstance.dialog(function(err, dialog) {
        dialog.users_count = count|0;
        dialog.save(function (err, obj) {
          return next();
        });
      });
    });
  };
};
