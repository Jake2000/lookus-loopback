module.exports = function(Settings) {
  Settings.disableRemoteMethod('create', true);
  Settings.disableRemoteMethod('upsert', true);
  Settings.disableRemoteMethod('update', true);
  Settings.disableRemoteMethod('deleteById', true);
  Settings.disableRemoteMethod('updateAll', true);
  Settings.disableRemoteMethod('exists', true);
  Settings.disableRemoteMethod('findOne', true);
  Settings.disableRemoteMethod('count', true);
  Settings.disableRemoteMethod('find', true);
  Settings.disableRemoteMethod('prototype.updateAttributes', true);
  Settings.disableRemoteMethod('findById', true);

  Settings.disableRemoteMethod('__get__user', true);
  Settings.disableRemoteMethod('prototype.__get__user', true);
};
