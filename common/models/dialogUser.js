var loopback = require('loopback');
var app = require('./../../server/server');
var noop = function() {};

module.exports = function(DialogUser) {

  DialogUser.afterSave = function (next) {
    var modelInstance = this;
    // updating dialog users count
    app.models.dialogUser.count({dialog_id: modelInstance.dialog_id}, function (err, count) {
      modelInstance.dialog(function(err, dialog) {
        dialog.users_count = count|0;
        dialog.save(function (err, obj) {
          return next();
        });
      });
    });

    app.models.user.findById(modelInstance.user_id, function(err,user) {
      user.dialogs_count++;
      user.save(function(err, user) {
        return;
      })
    });
  };

  DialogUser.beforeDestroy = function(next, modelInstance) {
    app.models.user.findById(modelInstance.user_id, function(err,user) {
      user.dialogs_count--;
      user.save(function(err, user) {
        return;
      })
    });
    next();
  }
};
