var app = require('./../../server/server');
var loopback = require('loopback');
var _ = require('lodash');

var MAX_CACHE_ZOOM = 16;

module.exports = function(Marker) {
  Marker.disableRemoteMethod('upsert', true);
  Marker.disableRemoteMethod('update', true);
  Marker.disableRemoteMethod('updateAll', true);
  Marker.disableRemoteMethod('exists', true);
  Marker.disableRemoteMethod('findOne', true);
  Marker.disableRemoteMethod('find', true);
  Marker.disableRemoteMethod('count', true);

  Marker.beforeCreate = function(next, modelInstance) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if(!currentUser) {
      var err = new Error('Access Exception');
      err.status = 403;
      err.errorCode = 40301;
      return next(err);
    }

    // Attaching user
    modelInstance.userId = currentUser.id;

    //TODO replace with findByUserId
    app.models.marker.find({userId:currentUser.id}, function(err, marker) {
        if(err) {
          return next(err);
        }

        if(marker) {

          //if our user is admin - we allow to create multiple markers
          app.models.Role.isInRole('admin', {principalType: app.models.RoleMapping.USER, principalId: currentUser.id}, function(err, exists) {

            if (exists){
              return next();
            } else {
              var err = new Error("You can't create a new marker without deleting the existed");
              err.status = 422;
              err.errorCode = 42203;
              return next(err);
            }
          });
        }
    });
  };

  Marker.afterCreate = function(next) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if(!currentUser) {
      var err = new Error('Access Exception');
      err.status = 403;
      err.errorCode = 40301;
      return next(err);
    }
    var modelInstance = this;
    app.models.dialog.create({
      marker_id: modelInstance.id,
      title: modelInstance.text,
      is_private: false
    }, function(err, dialog) {
      dialog.users.add(currentUser, function(err, ok) {
        next();
      });
    });
  };

  /**
   *
   * @param {number} lat1
   * @param {number} lng1
   * @param {number} lat2
   * @param {number} lng2
   * @returns {{lat: number, lng: number}}
   */
  var getCenter = function(lat1, lng1, lat2, lng2) {
    lat1 = lat1 + 90;
    lat2 = lat2 + 90;

    lng1 = lng1 + 180;
    lng2 = lng2 + 180;

    var latCenter = 0;
    var lngCenter = 0;

    if(lat2>lat1) {
      latCenter = (lat2-lat1/2);
    } else if(lat1>lat2) {
      latCenter = (lat1-lat2/2);
    } else {
      latCenter = lat1;
    }

    if(lng2>lng1) {
      lngCenter = (lng2-lng1/2);
    } else if(lng1>lng2) {
      lngCenter = (lng1-lng2/2);
    } else {
      lngCenter = lng1;
    }

    return {
      lat: (latCenter - 90),
      lng: (lngCenter - 180)
    };
  };

  Marker.getCachedLocationByIndex = function(index, zoom) {
    var latCacheKey = getCellCacheLatitudeKeyByIndex(index, zoom);
    var lngCacheKey = getCellCacheLongitudeKeyByIndex(index, zoom);
    var lat = this.hget(latCacheKey);
    var lng = this.hget(lngCacheKey);

    if(_.isNull(lat) || _.isNull(lng))
      return null;

    return {
      lat: lat, lng: lng
    }
  };

  Marker.setCachedLocationByIndex = function(index, zoom, location) {
    var cacheKey = getCellCacheKeyByIndex(index, zoom);
  };

  Marker.incrCachedCountByIndex = function(index, zoom) {
    var cacheKey = getCellCacheKeyByIndex(index, zoom);
    this.increment(cacheKey, 1);
  };

  Marker.getCachedCountByIndex = function(index, zoom) {
    var cacheKey = getCellCacheKeyByIndex(index, zoom);
    return this.hget(cacheKey)|0;
  };

  Marker.afterSave = function(next) {
    var modelInstance = this;
    var location = modelInstance.location;

    // we should update grid cache
    for(var zoom = 0; zoom <= MAX_CACHE_ZOOM; zoom++) {
      var index = getCellIndex(modelInstance.location, zoom);
      var count = Marker.getCachedCountByIndex(index, zoom);

      var cachedLocation = Marker.getCachedLocationByIndex(index, zoom);

      if(count>0 && !cachedLocation) {
        var center = getCenter(cachedLocation.lat, cachedLocation.lng, location.lat, location.lng);
        Marker.setCachedLocationByIndex(index, zoom, center);
      } else {
        Marker.setCachedLocationByIndex(index, zoom, location);
      }
      Marker.incrCachedCountByIndex(index, zoom);
    }
    next();
  };

  Marker.afterDestroy = function(next) {
    var modelInstance = this;

    // we should update grid cache
    for(var zoom= 0; zoom <= MAX_CACHE_ZOOM; zoom++) {
      var cellIndex = getCellCacheKey(modelInstance.location, zoom);
      Marker.decrement(cellIndex, 1);
    }
    next();
  };

  /**
   *
   * Generally used geo measurement function
   *
   * @param {Number} lat1
   * @param {Number} lon1
   * @param {Number} lat2
   * @param {Number} lon2
   * @returns {Number}
   */
  var GeoDistance = function(lat1, lon1, lat2, lon2){
    var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000;
  };

  // http://www.tytai.com/gmap/
  // http://www.wolfpil.de/v3/deep-zoom.html
  // http://www.manuel-bieh.de/publikationen/scripts/geolib/demo.html

  var GeoDistanceFromZero = function(lat, lng) {
      return GeoDistance(0,0, lat, lng);
  };

  /**
   *
   * @param {{lat:Number, lng:Number}} location
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLatitudeCellIndex = function(location, zoom) {
      var latResolution = 0.000005; //~ 1m

      if(zoom <= 0 ) {
        latResolution = 5;        // 1000km;
      } else if(zoom == 1 ) {
        latResolution = 2.5;      // 500km;
      } else if(zoom == 2 ) {
        latResolution = 1.25;     // 250km;
      } else if(zoom == 3 ) {
        latResolution = 0.625;    // 125km;
      } else if(zoom == 4 ) {
        latResolution = 0.3;      // 60km;
      } else if(zoom == 5 ) {
        latResolution = 0.15;     // 30km;
      } else if(zoom == 6 ) {
        latResolution = 0.075;    // 15km;
      } else if(zoom == 7 ) {
        latResolution = 0.0375;   // 7km;
      } else if(zoom == 8 ) {
        latResolution = 0.01875;  // 3.5km;
      } else if(zoom == 9 ) {
        latResolution = 0.0125;   // 1.75km;
      } else if(zoom == 10 ) {
        latResolution = 0.00625;      // 850m;
      } else if(zoom == 11 ) {
        latResolution = 0.003125;      // 400m;
      } else if(zoom == 12 ) {
        latResolution = 0.0015625;      // 200m;
      } else if(zoom == 13 ) {
        latResolution = 0.00078125;      // 100m;
      } else if(zoom == 14 ) {
        latResolution = 0.000390625;      // 50m;
      } else if(zoom == 15 ) {
        latResolution = 0.0001953125;      // 25m;
      } else if(zoom == 16 ) {
        latResolution = 0.00009765625;      // 10m;
      } else if(zoom == 17 ) {
        latResolution = '-';     //no-clustering
      } else if(zoom == 18 ) {
        latResolution = '-';     //no-clustering
      } else if(zoom == 19 ) {
        latResolution = '-';     //no-clustering
      } else if(zoom >= 20 ) {
        latResolution = '-';     //no-clustering
      }

      return ((location.lat + 90.0) / latResolution)|0;
  };

  /**
   *
   * @param {{lat:Number, lng:Number}} location
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLongitudeCellIndex = function(location, zoom) {
    var lngResolution = 0.00002;

    if(zoom <= 0 ) {
      lngResolution = 5;        // 1000km;
    } else if(zoom == 1 ) {
      lngResolution = 2.5;      // 500km;
    } else if(zoom == 2 ) {
      lngResolution = 1.25;     // 250km;
    } else if(zoom == 3 ) {
      lngResolution = 0.625;    // 125km;
    } else if(zoom == 4 ) {
      lngResolution = 0.3;      // 60km;
    } else if(zoom == 5 ) {
      lngResolution = 0.15;     // 30km;
    } else if(zoom == 6 ) {
      lngResolution = 0.075;    // 15km;
    } else if(zoom == 7 ) {
      lngResolution = 0.0375;   // 7km;
    } else if(zoom == 8 ) {
      lngResolution = 0.01875;  // 3.5km;
    } else if(zoom == 9 ) {
      lngResolution = 0.0125;   // 1.75km;
    } else if(zoom == 10 ) {
      lngResolution = 0.00625;      // 850m;
    } else if(zoom == 11 ) {
      lngResolution = 0.003125;      // 400m;
    } else if(zoom == 12 ) {
      lngResolution = 0.0015625;      // 200m;
    } else if(zoom == 13 ) {
      lngResolution = 0.00078125;      // 100m;
    } else if(zoom == 14 ) {
      lngResolution = 0.000390625;      // 50m;
    } else if(zoom == 15 ) {
      lngResolution = 0.0001953125;      // 25m;
    } else if(zoom == 16 ) {
      lngResolution = 0.00009765625;      // 10m;
    } else if(zoom == 17 ) {
      lngResolution = '-';     //no-clustering
    } else if(zoom == 18 ) {
      lngResolution = '-';     //no-clustering
    } else if(zoom == 19 ) {
      lngResolution = '-';     //no-clustering
    } else if(zoom >= 20 ) {
      lngResolution = '-';     //no-clustering
    }

    return ((location.lng + 180.0) / lngResolution)|0;
  };

  /**
   *
   * @param location
   * @param {Number} zoom
   * @returns {{latIndex: Number, lngIndex: Number}}
   */
  var getCellIndex = function(location, zoom) {
    return {  latIndex: getLatitudeCellIndex(location, zoom),
              lngIndex: getLongitudeCellIndex(location, zoom)
    };
  };

  /**
   *
   * @param location
   * @param {Number} zoom
   * @returns {String}
   */
  var getCellCacheKey = function(location, zoom) {
    var latIndex = getLatitudeCellIndex(location, zoom);
    var lngIndex = getLongitudeCellIndex(location, zoom);
    return 'z:'+(zoom|0) + ':lng:'+lngIndex+':lat:'+latIndex;
  };

  var getCellCacheKeyByIndex = function(index, zoom) {
    return getCellCacheKeyByIndexes(index.latIndex, index.lngIndex, zoom);
  };

  var getCellCacheKeyByIndexes = function(latIndex, lngIndex, zoom) {
    return 'z:'+(zoom|0) + ':lng:'+lngIndex+':lat:'+latIndex;
  };

  var getCellCacheLatitudeKeyByIndex = function(index, zoom) {
    return getCellCacheLatitudeKeyByIndexes(index.latIndex, index.lngIndex, zoom);
  };

  var getCellCacheLatitudeKeyByIndexes = function(latIndex, lngIndex, zoom) {
    return 'z:'+(zoom|0) + ':lng:'+lngIndex+':lat:'+latIndex+':location:lat';
  };

  var getCellCacheLongitudeKeyByIndex = function(index, zoom) {
    return getCellCacheLongitudeKeyByIndexes(index.latIndex, index.lngIndex, zoom);
  };

  var getCellCacheLongitudeKeyByIndexes = function(latIndex, lngIndex, zoom) {
    return 'z:'+(zoom|0) + ':lng:'+lngIndex+':lat:'+latIndex+':location:lng';
  };

  Marker.nearby = function(location, zoom, cb) {

    console.log(arguments);

    var index = getCellIndex(location, zoom);

    if(zoom >= MAX_CACHE_ZOOM ) {

      // we can do no-caching here
      app.models.marker.find({ geo: {near: location, maxDistance: 2}}, function(err, markers) {
        if(err) {
          return cb(err);
        }

        if(markers) {
          return cb(null, markers);
        }
      });
    } else {
      // retrieving from cache
      console.log( index);

      var markers = [];
      var lat1 = index.latIndex - 5;
      var lat2 = index.latIndex + 5;
      var lng1 = index.lngIndex - 5;
      var lng2 = index.lngIndex + 5;

      for(var latIndex = lat1; latIndex<=lat2; latIndex++) {
        for(var lngIndex = lng1; lngIndex<=lng2; lngIndex++) {

          var count = this.hget(getCellCacheKeyByIndexes(latIndex,lngIndex, zoom));

          var latCacheKey = getCellCacheLatitudeKeyByIndexes(latIndex,lngIndex, zoom);
          var lngCacheKey = getCellCacheLongitudeKeyByIndexes(latIndex,lngIndex, zoom);

          var marker = {
            is_clustered: true,
            count: count,
            location: {

            }
          };

          markers.push(marker);

        }
      }
      return cb(null, markers);
    }


  };

  Marker.remoteMethod('nearby',
    {
      description: 'Get nearby markers (implementation in progress)',
      accepts: [
        {arg: 'data', type: "locationModel", required: true, http: {source: 'body'}},
        {arg: 'zoom', type: "integer", required: true, http: {source: 'query'}}
      ],
      returns: {
        arg: 'markers', type: 'marker', root: true,
        description:
          'The response body contains array of markers.\n'
      },
      accessType: 'READ',
      http: {verb: 'post', path: '/nearby'}
    }
  );
};

