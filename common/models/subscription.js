module.exports = function(Subscription) {
  Subscription.disableRemoteMethod('upsert', true);
  Subscription.disableRemoteMethod('update', true);
  Subscription.disableRemoteMethod('updateAll', true);
  Subscription.disableRemoteMethod('exists', true);
  Subscription.disableRemoteMethod('findOne', true);
  Subscription.disableRemoteMethod('find', true);
};
