var debug = require('debug')('boot:add-a-redis');
var _ = require('lodash');
var async = require("async");
var redis = require("redis");

/**
 *
 * @param {express} app
 */
module.exports = function(app) {
  console.log('add-a-redis');

  app.redisCache = {};
  //app.redisCache.client = {};
  app.redisCache.client = redis.createClient();
  app.redisCache.client.on("error", function (err) {
    console.log("Redis cache error ", err);
  });
  app.redisCache.client.select(3, function() {});

  /**
   *
   * @param key
   * @param fn
   * @param cb
   * @param context
   */
  app.redisCache.remember = function (key, fn, cb, context) {
    var self = app.redisCache;
    async.waterfall([
        function (cb) {
          // Retrieving objects from cache
          self.client.hgetall(key, function (err, obj) {
            if (err || !obj) {
              return cb(null, null);
            }
            var cachedObject = app.deserialize(obj.type, obj.subtype, obj.entities, obj.json);
            //console.log('[TRedisCacheModule:remember] key:[', key, '] deserialized: name: [', obj.subtype, ']');
            cb(null, cachedObject);
          });
        },
        function (cachedObject, cb) {
          if (!_.isNull(cachedObject) && !_.isUndefined(cachedObject)) {
            //console.log('[TRedisCacheModule:remember] key:[', key, '] object successfully got from cache');
            return cb(null, cachedObject);
          }

          //console.log('[TRedisCacheModule:remember] key:[', key, '] object will be fetched to save to cache');

          fn.call(context, function (err, res) {
            var sr = app.serialize(context.modelName, res);
            //console.log(sr);
            self.client.hset(key, 'type', sr.type);
            self.client.hset(key, 'subtype', sr.subtype);
            self.client.hset(key, 'entities', sr.entities);
            self.client.hset(key, 'json', sr.json);

            cb(err, res);
          });
        }],
      function (err, res) {
        if (err) {
          //console.log('[TRedisCacheModule:remember] key:[', key, '] error: ', err);
          cb(err);
          return;
        }
        cb(null, res);
      }
    );
  };

  /**
   * Flushes cache by key
   * @param key
   */
  app.redisCache.forget= function (key) {
    app.redisCache.client.hdel(key, 'json', 'entities', 'subtype', 'type');
  };

  app.redisCache.set= function (key, object) {
    this.client.hset(key, 'value', JSON.stringify(object));
  };

  app.redisCache.get= function (key, object) {
    return JSON.parse(this.client.hget(key, 'value'));
  };

  app.redisCache.increment = function (key, increment) {
    increment = increment || 1;
    this.client.hincrby(key, 'value', increment);
  };

  app.redisCache.decrement = function (key, decrement) {
    decrement = decrement || 1;
    this.client.hdecrby(key, 'value', decrement);
  };

  //TODO manage situation when app is connecting to redis and DataSource request occurred

};
