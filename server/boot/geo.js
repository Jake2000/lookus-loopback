var _ = require('lodash');

var MAX_CACHED_ZOOM = 16;
var CACHE_KEY = 'geo:';

/**
 *
 * @param {express} app
 */
module.exports = function(app) {

  /**
   * Geo Point object
   * @typedef {Object} Point
   * @property {number} lat - Latitude
   * @property {number} lng - Longitude
   */

  /**
   * Point cell object
   * @typedef {Object} PointCell
   * @property {number} latCell - Latitude index
   * @property {number} lngCell - Longitude index
   * @property {number} zoom - zoom
   */

  /**
   * Cell info object
   * @typedef {Object} CellInfo
   * @property {number} lat - Latitude of centroid in cell
   * @property {number} lng - Longitude of centroid in cell
   * @property {number} points - Number of points
   */

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLatitudeCellIndex = function(Point, zoom) {
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

    return ((Point.lat + 90.0) / latResolution)|0;
  };

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLongitudeCellIndex = function(Point, zoom) {
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

    return ((Point.lng + 180.0) / lngResolution)|0;
  };

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {PointCell}
   */
  var getCell = function(Point, zoom) {
    return {
      latCell: getLatitudeCellIndex(Point, zoom),
      lngCell: getLongitudeCellIndex(Point, zoom),
      zoom: zoom
    };
  };

  /**
   *
   * @param {Point} Point1
   * @param {Point} Point2
   * @returns {Point}
   */
  var getCenter = function(Point1, Point2) {
    return getCenterByCoordinates(Point1.lat, Point1.lng, Point2.lat, Point2.lng);
  };

  /**
   *
   * @param {number} lat1
   * @param {number} lng1
   * @param {number} lat2
   * @param {number} lng2
   * @returns {Point}
   */
  var getCenterByCoordinates = function(lat1, lng1, lat2, lng2) {
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

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {String}
   */
  var getCellCache = function(Point, zoom) {
    var cell = getCell(Point, zoom);
    return getCellCacheKey(cell);
  };

  /**
   *
   * @param {PointCell} cell
   * @returns {string}
   */
  var getCellCacheKey = function(cell) {
    return CACHE_KEY+'z:'+(cell.zoom|0) + ':lng:'+cell.latCell+':lat:'+cell.lngCell;
  };

  /**
   *
   * @param {PointCell} cell
   * @param {function(err:*,res:*)} cb
   * @returns {CellInfo}
   */
  var getCellInfo = function(cell, cb) {
    var cacheKey = getCellCacheKey(cell);

    app.redisCache.client.hgetall(cacheKey, function(err, obj) {

      if (err || !obj) {
        return cb(null, null);
      }

      if(_.isNull(obj.lat) || _.isNull(obj.lng) || _.isNull(obj.number)) {
        return cb(null, null);
      }

      cb(null, {
        lat: obj.lat,
        lng: obj.lng,
        points: obj.number
      });
    });
  };

  /**
   *
   * @param {PointCell} cell
   * @param {Point} point
   */
  var addCellPoint = function(cell, point) {
    var cacheKey = getCellCacheKey(cell);

    app.redisCache.client.hset(cacheKey, 'lat', point.lat);
    app.redisCache.client.hset(cacheKey, 'lng', point.lng);
    app.redisCache.client.hincrby(cacheKey, 'number', 1);

  };

  /**
   *
   * @param {PointCell} cell
   * @param {Point} point
   */
  var removeCellPoint = function(cell, point) {
    var cacheKey = getCellCacheKey(cell);

    app.redisCache.client.hincrby(cacheKey, 'number', -1);

  };

  /**
   *
   * @param {PointCell} cell
   * @param {Number} distance
   * @returns {Array<PointCell>}
   */
  var getAdjacentCells = function(cell, distance) {
    var cells = [];

    for(var latIndex = cell.latCell-distance; latIndex < cell.latCell+distance; latIndex++) {
      for(var lngIndex = cell.lngCell-distance; lngIndex < cell.lngCell+distance; lngIndex++) {
        cells.push({ latCell: latIndex, lngCell: lngIndex, zoom: cell.zoom});
      }
    }

    return cells;
  };

  app.geo = app.geo || {};

  app.geo.MAX_CACHED_ZOOM = MAX_CACHED_ZOOM;
  app.geo.getCell = getCell;
  app.geo.getCellInfo = getCellInfo;
  app.geo.addCellPoint = addCellPoint;
  app.geo.removeCellPoint = removeCellPoint;
  app.geo.getAdjacentCells = getAdjacentCells;

};
