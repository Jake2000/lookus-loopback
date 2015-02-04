module.exports = function(UserSetting) {
  UserSetting.disableRemoteMethod('create', true);
  UserSetting.disableRemoteMethod('upsert', true);
  UserSetting.disableRemoteMethod('update', true);
  UserSetting.disableRemoteMethod('deleteById', true);
  UserSetting.disableRemoteMethod('updateAll', true);
  UserSetting.disableRemoteMethod('exists', true);
  UserSetting.disableRemoteMethod('findOne', true);
  UserSetting.disableRemoteMethod('count', true);
  UserSetting.disableRemoteMethod('find', true);
  UserSetting.disableRemoteMethod('prototype.updateAttributes', true);
  UserSetting.disableRemoteMethod('findById', true);

  UserSetting.disableRemoteMethod('__get__user', true);
  UserSetting.disableRemoteMethod('prototype.__get__user', true);

};
