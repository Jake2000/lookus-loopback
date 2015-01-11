var loopback = require('loopback');
var app = require('./../../server/server');
var noop = function() {};

module.exports = function(Dialoguser) {

  Dialoguser.afterSave = function (next) {
    var modelInstance = this;
    console.log('dialoguser afterSave');

    app.models.dialoguser.count({dialog_id: modelInstance.dialog_id}, function (err, count) {
      console.log('count', (count | 0));
      modelInstance.dialog(function(err, dialog) {
        dialog.users_count = count|0;
        dialog.save(function (err, obj) {
          console.log('saved');
          return next();
        });
      });
    });
  };
};
