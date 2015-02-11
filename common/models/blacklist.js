var loopback = require('loopback');
var app = require('./../../server/server');

module.exports = function(Blacklist) {
  Blacklist.disableRemoteMethod('count', true);
  Blacklist.disableRemoteMethod('upsert', true);
  Blacklist.disableRemoteMethod('update', true);
  Blacklist.disableRemoteMethod('updateOne', true);
  Blacklist.disableRemoteMethod('updateAll', true);
  Blacklist.disableRemoteMethod('exists', true);
  Blacklist.disableRemoteMethod('findOne', true);
  Blacklist.disableRemoteMethod('findById', true);
};
