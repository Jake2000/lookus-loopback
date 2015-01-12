var loopback = require('loopback');
var app = require('./../../server/server');

module.exports = function(BlacklistItem) {
  BlacklistItem.disableRemoteMethod('count', true);
  BlacklistItem.disableRemoteMethod('upsert', true);
  BlacklistItem.disableRemoteMethod('update', true);
  BlacklistItem.disableRemoteMethod('updateOne', true);
  BlacklistItem.disableRemoteMethod('updateAll', true);
  BlacklistItem.disableRemoteMethod('exists', true);
  BlacklistItem.disableRemoteMethod('findOne', true);
  BlacklistItem.disableRemoteMethod('deleteById', true);
  BlacklistItem.disableRemoteMethod('findById', true);
};
