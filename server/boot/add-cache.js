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
          //console.log('read: '+ cacheKey);
          app.redisCache.remember(cacheKey, fn, cb, this);
        };

  User.forget = Settings.forget =
    AccessToken.forget = Marker.forget =
      Dialog.forget = Message.forget =
        function(key) {
          var cacheKey = this.modelName + ':'+ key;
          app.redisCache.forget(cacheKey);
        };

  User.increment = Settings.increment =
    AccessToken.increment = Marker.increment =
      Dialog.increment = Message.increment =
        function(key, increment) {
          var cacheKey = this.modelName + ':'+ key;
          //console.log('increment: '+ cacheKey);
          return app.redisCache.increment(cacheKey, increment);
        };

  User.decrement = Settings.decrement =
    AccessToken.decrement = Marker.decrement =
      Dialog.decrement = Message.decrement =
        function(key, decrement) {
          var cacheKey = this.modelName + ':'+ key;
          //console.log('decrement: '+ cacheKey);
          return app.redisCache.decrement(cacheKey, decrement);
        };

  User.hget = Settings.hget =
    AccessToken.hget = Marker.hget =
      Dialog.hget = Message.hget =
        function(key) {
          var cacheKey = this.modelName + ':'+ key;
          //console.log('hget: '+ cacheKey);
          return app.redisCache.get(cacheKey);
        };

  User.hset = Settings.hset =
    AccessToken.hset = Marker.hset =
      Dialog.hset = Message.hset =
        function(key, value) {
          var cacheKey = this.modelName + ':'+ key;
          //console.log('hset: '+ cacheKey);
          return app.redisCache.set(cacheKey, value);
        };

  //var User_findById = User.findById;
  //User.findById = function(id, cb) {
  //  this.remember("findById:"+id, function(daoCb) {
  //    User_findById.call(this, id, function(err, res){
  //
  //      daoCb(err,res);
  //    });
  //  }, cb);
  //};

  console.log('add-cache:done');
};
