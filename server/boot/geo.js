var _ = require('lodash');

var MAX_CACHED_ZOOM = 16;
var CACHE_KEY = 'geo:';
var B = 100000000;
var runtimeCache = {};

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
   * Offset object
   * @typedef {Object} Offset
   * @property {number} latOffset - Latitude offset
   * @property {number} lngOffset - Longitude offset
   */

  /**
   *
   * @param {number} zoom
   * @returns {number}
   */
  var getResolution = function(zoom) {
    var resolution = 0.00002;

    if(zoom <= 1 ) {
      return 10;
    }

    return 40/(Math.pow(2, zoom));
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
   * @param {Point} point
   * @returns {Offset}
   */
  var getCellPointOffset = function(cell, point) {

    var resolution = getResolution(cell.zoom);
    var latOffset = (point.lat + 90) - (cell.latCell * resolution);
    var lngOffset = (point.lng + 180) - (cell.lngCell * resolution * 2);

    return {
      latOffset: latOffset,
      lngOffset: lngOffset
    }
  };

  /**
   *
   * @param {PointCell} cell
   * @returns {Point}
   */
  var getCellZeroPoint = function(cell) {

    var resolution = getResolution(cell.zoom);
    var lat = (cell.latCell * resolution) - 90;
    var lng = (cell.lngCell * resolution * 2) - 180;

    return {
      lat:lat,
      lng:lng
    }
  };

  /**
   *
   * @param {PointCell} cell
   * @returns {Point}
   */
  var getCellCenterPoint  = function(cell) {
    var resolution = getResolution(cell.zoom);

    var cLatCell = ((cell.latCell*2 + 1)*resolution)/2 - 90;
    var cLngCell = ((cell.lngCell*2 + 1)*resolution*2)/2 - 180;

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
    var zeroPoint = getCellZeroPoint(cell);

    var cellInfo = runtimeCache[cacheKey];

    if(_.isUndefined(cellInfo))
      return cb(null, false);

    if(cellInfo === false)
      return cb(null, false);

    if(cellInfo)
      return cb(null, cellInfo);

    app.redisCache.client.hgetall(cacheKey, function(err, obj) {

      if (err || !obj) {
        runtimeCache[cacheKey] = false;
        return cb(null, null);
      }

      if(obj.number == 0 || _.isNull(obj.totalLatOffset) || _.isNull(obj.totalLngOffset) || _.isNull(obj.number)) {
        runtimeCache[cacheKey] = false;
        return cb(null, null);
      }

      runtimeCache[cacheKey] = {
        lat: zeroPoint.lat + ((obj.totalLatOffset/B)/obj.number),
        lng: zeroPoint.lng + ((obj.totalLngOffset/B)/obj.number),
        points: obj.number
      };

      cb(null, runtimeCache[cacheKey]);
    });
  };

  /**
   *
   * @param {PointCell} cell
   * @param {Point} point
   */
  var addCellPoint = function(cell, point) {
    var cacheKey = getCellCacheKey(cell);
    var cellOffset = getCellPointOffset(cell, point);
    console.log(cellOffset);

    runtimeCache[cacheKey] = null;

    app.redisCache.client.hincrby(cacheKey, 'totalLatOffset', (cellOffset.latOffset*B)|0);
    app.redisCache.client.hincrby(cacheKey, 'totalLngOffset', (cellOffset.lngOffset*B)|0);
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
    var cellOffset = getCellPointOffset(cell, point);

    runtimeCache[cacheKey] = null;

    app.redisCache.client.hincrby(cacheKey, 'totalLatOffset', -((cellOffset.latOffset*B)|0));
    app.redisCache.client.hincrby(cacheKey, 'totalLngOffset', -((cellOffset.lngOffset*B)|0));
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
