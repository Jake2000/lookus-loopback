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
   * @param {number} zoom
   * @returns {number}
   */
  var getResolution = function(zoom) {
    var resolution = 0.00002;

    return 20/(Math.pow(2, zoom));

    if(zoom <= 0 ) {
      resolution = 10;        // 2000km;
    } else if(zoom == 1 ) {
      resolution = 5;        // 1000km;
    } else if(zoom == 2 ) {
      resolution = 4;     // 500km;
    } else if(zoom == 3 ) {
      resolution = 2.5;    // 250km;
    } else if(zoom == 4 ) {
      resolution = 2;    // 125km;
    } else if(zoom == 5 ) {
      resolution = 1.5;     // 30km;
    } else if(zoom == 6 ) {
      resolution = 1.2;    // 15km;
    } else if(zoom == 7 ) {
      resolution = 0.1;   // 7km;
    } else if(zoom == 8 ) {
      resolution = 0.05;  // 3.5km;
    } else if(zoom == 9 ) {
      resolution = 0.03;   // 1.75km;
    } else if(zoom == 10 ) {
      resolution = 0.02;      // 850m;
    } else if(zoom == 11 ) {
      resolution = 0.01;      // 800m;  !
    } else if(zoom == 12 ) {
      resolution = 0.007;      // 400m;  !
    } else if(zoom == 13 ) {
      resolution = 0.006;      // 100m;
    } else if(zoom == 14 ) {
      resolution = 0.005;      // 50m;
    } else if(zoom == 15 ) {
      resolution = 0.001;      // 25m;
    } else if(zoom == 16 ) {
      resolution = 0.0001;      // 10m;
    } else if(zoom == 17 ) {
      resolution = 0.0001;     //no-clustering
    } else if(zoom == 18 ) {
      resolution = 0.0001;     //no-clustering
    } else if(zoom == 19 ) {
      resolution = 0.0001;     //no-clustering
    } else if(zoom >= 20 ) {
      resolution = 0.0001;     //no-clustering
    }

    return resolution;
  };

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLatitudeCellIndex = function(Point, zoom) {
    var resolution = getResolution(zoom);

    return ((Point.lat + 90.0) / resolution)|0;
  };

  /**
   *
   * @param {Point} Point
   * @param {Number} zoom
   * @returns {Number}
   */
  var getLongitudeCellIndex = function(Point, zoom) {
    var resolution = getResolution(zoom)*2;

    return ((Point.lng + 180.0) / resolution)|0;
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
   * @param {PointCell} cell
   * @returns {Point}
   */
  var getCellCenterPoint  = function(cell) {
    var resolution = getResolution(cell.zoom);

    var cLatCell = ((cell.latCell*2 +1)*resolution)/2 - 90;
    var cLngCell = ((cell.lngCell*2 +1)*resolution*2)/2 - 180;

    return {
      lat: cLatCell,
      lng: cLngCell
    }
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

    var cellCenter = getCellCenterPoint(cell);

    app.redisCache.client.hset(cacheKey, 'lat', cellCenter.lat);
    app.redisCache.client.hset(cacheKey, 'lng', cellCenter.lng);
    app.redisCache.client.hincrby(cacheKey, 'number', 1);

  };

  /**
   *
   * @param {Point} point
   */
  var addPoint = function(point) {
    for(var zoom = 0; zoom <= MAX_CACHED_ZOOM; zoom++) {
      var cell = getCell(point, zoom);
      addCellPoint(cell, point);
    }
  };

  /**
   *
   * @param {Point} point
   */
  var removePoint = function(point) {
    for(var zoom = 0; zoom <= MAX_CACHED_ZOOM; zoom++) {
      var cell = getCell(point, zoom);
      removeCellPoint(cell, point);
    }
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
  app.geo.addPoint = addPoint;
  app.geo.removePoint = removePoint;

};
