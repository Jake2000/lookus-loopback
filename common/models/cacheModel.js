/**
 * @class CacheModel
 * @inherits {PersistedModel}
 * @param CacheModel
 */
module.exports = function(CacheModel) {
  CacheModel.remember = function(key, fn, cb) {
    var cacheKey = this.modelName + ':'+ key;
    app.redisCache.remember(cacheKey, fn, cb, this);
  };
};
