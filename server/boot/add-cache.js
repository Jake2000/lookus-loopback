var debug = require('debug')('boot:add-cache');
var _ = require('lodash');
var async = require("async");

module.exports = function(app) {
  console.log('add-cache');
  var PersistedModel = app.loopback.PersistedModel;
  var Dao = app.dataSources.mongodb.DataAccessObject;

  var User = app.models.user;
  var Dialog = app.models.dialog;
  var AccessToken = app.models.AccessToken;
  var Marker = app.models.marker;
  var Message = app.models.message;
  var Settings = app.models.settings;

  User.remember = Settings.remember =
    AccessToken.remember = Marker.remember =
      Dialog.remember = Message.remember =
        function(key, fn, cb) {
          var cacheKey = this.modelName + ':'+ key;
          console.log('read: '+ cacheKey);
          app.redisCache.remember(cacheKey, fn, cb, this);
        };

  User.forget = Settings.forget =
    AccessToken.forget = Marker.forget =
      Dialog.forget = Message.forget =
        function(key) {
          var cacheKey = this.modelName + ':'+ key;
          app.redisCache.forget(cacheKey);
        };

  //var User_findById = User.findById;
  //User.findById = function(id, cb) {
  //  this.remember("User:findById:"+id, function(daoCb) {
  //    User_findById.call(this, id, function(err, res){
  //
  //      daoCb(err,res);
  //    });
  //  }, cb);
  //};

  console.log('add-cache:done');
};
