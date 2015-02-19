var apn = require('apn');

var options = { };

var apnConnection = new apn.Connection(options);

/**
 *
 * @param {express} app
 */
module.exports = function(app) {

  function addDevice(user, iOSDeviceToken, cb) {
    user.iOSDeviceToken = iOSDeviceToken;

    var myDevice = new apn.Device(token);
  }

};
