var loopback = require('loopback');

module.exports = function(Dialog) {
  Dialog.disableRemoteMethod('create', true);
  Dialog.disableRemoteMethod('update', true);
  Dialog.disableRemoteMethod('updateOne', true);
  Dialog.disableRemoteMethod('deleteById', true);
  Dialog.disableRemoteMethod('deleteOne', true);
  Dialog.disableRemoteMethod('updateAll', true);
  Dialog.disableRemoteMethod('exists', true);
  Dialog.disableRemoteMethod('findOne', true);
  Dialog.disableRemoteMethod('count', true);
  Dialog.disableRemoteMethod('upsert', true);

  Dialog.afterUpdate = function(next) {
    var modelInstance = this;
    modelInstance.users.count({}, function(err, count) {
      modelInstance.users_count = count | 0;
      modelInstance.save();
      next();
    });
  };
};
