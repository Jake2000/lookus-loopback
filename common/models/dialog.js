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
  Dialog.disableRemoteMethod('find', true);
};
