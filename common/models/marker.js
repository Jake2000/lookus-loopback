var app = require('./../../server/server');
var loopback = require('loopback');
var _ = require('lodash');
var async = require('async');


module.exports = function(Marker) {
  Marker.disableRemoteMethod('upsert', true);
  Marker.disableRemoteMethod('update', true);
  Marker.disableRemoteMethod('updateAll', true);
  Marker.disableRemoteMethod('exists', true);
  Marker.disableRemoteMethod('findOne', true);
  Marker.disableRemoteMethod('find', true);
  Marker.disableRemoteMethod('count', true);

  Marker.disableRemoteMethod('__destroy__dialog', false);
  Marker.disableRemoteMethod('__destroy__dialog', false);
  Marker.disableRemoteMethod('__create__dialog', false);
  Marker.disableRemoteMethod('__update__dialog', false);

  Marker.canCreate = function(user, cb) {
    if(!(user instanceof app.models.user)) {
      var err = new Error("User model needed");
      err.status = 500;
      err.errorCode = 50001;
      return cb(err);
    }

    //TODO replace with findByUserId
    app.models.marker.find({ where: {user_id: user.id} }, function(err, markers) {
      if(err) {
        return cb(err);
      }

      if(markers.length == 0) {
        return cb(null, true);
      }

      if(markers.length>0) {
        user.isAdmin(function(err, isAdmin) {
          if(isAdmin) {
            return cb(null, true);
          }

          var err1 = new Error("You can't create a new marker without deleting the existed");
          err1.status = 403;
          err1.errorCode = 40303;
          return cb(err1);
        })
      }
    });
  };

  Marker.beforeCreate = function(next, modelInstance) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    // Attaching user
    modelInstance.user_id = currentUser.id;
    modelInstance.created = new Date();
    modelInstance.updated = new Date();
    modelInstance.is_up = false;
    modelInstance.is_active = true;

    Marker.canCreate(currentUser, function(err, canCreate) {
      if(err) { return next(err); }

      next();
    });
  };

  Marker.beforeUpdate = function(next, modelInstance) {
    modelInstance.updated = new Date();
    next();
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
    app.io.emitEventForUser('*', 'marker:created', modelInstance);
    app.models.dialog.create({
      marker_id: modelInstance.id,
      title: modelInstance.text,
      is_private: false,
      is_group: true
    }, function(err, dialog) {
      dialog.users.add(currentUser, function(err, ok) {
        next();
      });
    });

    currentUser.markers_count++;
    currentUser.save(function(err, user) {
      return;
    });
  };

  Marker.afterSave = function(next) {
    var modelInstance = this;

    // we should update grid cache
    app.geo.addPoint(modelInstance.location);
    next();
  };

  Marker.afterDestroy = function(next) {
    var modelInstance = this;

    // we should update grid cache
    app.geo.removePoint(modelInstance.location);
    next();
  };

  Marker.nearby = function(lat, lng, zoom, cb) {
    if(zoom >= app.geo.MAX_CACHED_ZOOM ) {

      // we can do no-caching here
      app.models.marker.find({ geo: {near: { lat: lat, lng: lng }, maxDistance: 2}}, function(err, markers) {
        if(err) {
          return cb(err);
        }

        if(markers) {
          return cb(null, markers);
        }
      });
    } else {

      var cell = app.geo.getCell({ lat: lat, lng: lng }, zoom);
      var markers = [];
      var distance = ((zoom+1)*4.5 |0);
      //console.log(distance);

      var adjacentCells = app.geo.getAdjacentCells(cell, distance);

      async.each(adjacentCells, function(adjacentCell, cb) {
        app.geo.getCellInfo(adjacentCell, function(err, pointInfo) {
          if(pointInfo) {
            markers.push({
              is_clustered: true,
              count: pointInfo.points,
              location: {
                lat:pointInfo.lat,
                lng:pointInfo.lng
              }
            });
          }
          cb();
        });
      }, function(err, results) {
        return cb(null, markers);
      });
    }
  };

  Marker.remoteMethod('nearby', {
      description: 'Get nearby markers',
      accepts: [
        {arg: 'lat', type: "number", required: true, http: {source: 'query'}},
        {arg: 'lng', type: "number", required: true, http: {source: 'query'}},
        {arg: 'zoom', type: "integer", required: true, http: {source: 'query'}}
      ],
      returns: {
        arg: 'markers', type: 'marker', root: true,
        description:
          'The response body contains array of markers.\n'
      },
      accessType: 'READ',
      http: {verb: 'get', path: '/nearby'}
  });

  Marker.reindex = function(cb) {
    app.models.marker.find({}, function(err, markers) {
      async.eachSeries(markers,
        function(marker, cb) {
          app.geo.addPoint(marker.location);
          cb();
        }, function(err) {
          cb(null,'success');
      });
    });
  };

  Marker.remoteMethod('reindex', {
    description: 'Re-indexes all markers',
    accepts: [],
    returns: {},
    accessType: 'READ',
    http: {verb: 'post', path: '/reindex'}
  });

  Marker.prototype.up = function(cb) {
    this.is_up = true;

    this.save(function(err, marker) {
      cb(null);
    });
  };

  Marker.remoteMethod('up', {
    isStatic:false,
    description: 'Makes this marker up',
    accepts: [],
    accessType: 'WRITE',
    http: {verb: 'post', path: '/up'}
  });

  Marker.beforeRemote('prototype.uploadImage', function(ctx, modelInstance, next) {
    ctx.req.params.container = 'marker-images';
    app.models.container.upload(ctx.req, ctx.res, function(err, result) {
      if(err) { return next(err); }

      var ctx = loopback.getCurrentContext();
      ctx.set("filename", result.files.image[0].name);
      next();
    });
  });

  Marker.prototype.uploadImage = function(file, cb) {
    var ctx = loopback.getCurrentContext();
    var modelInstance = this;
    modelInstance.image_url = '/uploads/marker-images/' + ctx.get('filename');
    modelInstance.save(function(err, marker) {
      if(err) { return cb(err); }

      cb(null, marker);
    });

  };

  Marker.remoteMethod('uploadImage', {
    isStatic:false,
    description: 'Changes image of a marker',
    accepts: [
      {arg: 'image', type: "File", required: true, http: {source: 'body'}}
    ],
    returns: {
      arg: 'markers', type: 'marker', root: true
    },
    accessType: 'WRITE',
    http: {verb: 'post', path: '/uploadImage'}
  });

  Marker.findInactiveForUser = function(user, filter, cb) {
    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.user_id = user.id;
    filter.where.is_active = false;

    Marker.find(filter, function(err, markers) {
      if(err) {
        return cb(err);
      }

      cb(null,markers);
    })
  };

  Marker.findActiveForUser = function(user, filter, cb) {
    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.user_id = user.id;
    filter.where.is_active = true;

    Marker.find(filter, function(err, markers) {
      if(err) {
        return cb(err);
      }

      cb(null,markers);
    })
  };

  Marker.mapbox = function(topLeftLatitude, topLeftLongitude, bottomRightLatitude, bottomRightLongitude, zoom, cb) {
    if(zoom >= app.geo.MAX_CACHED_ZOOM ) {

      var minLat = Math.min(topLeftLatitude + 90, bottomRightLatitude + 90) - 90;
      var maxLat = Math.max(topLeftLatitude + 90, bottomRightLatitude + 90) - 90;

      var minLng = Math.min(topLeftLongitude + 180, bottomRightLongitude + 180) - 180;
      var maxLng = Math.max(topLeftLongitude + 180, bottomRightLongitude + 180) - 180;

      // we can do no-caching here
      app.models.marker.find({ geo: { geoWithin: { box: [[minLng, minLat],[maxLng,maxLat]] }}}, function(err, markers) {
        if(err) {
          return cb(err);
        }

        if(markers) {
          return cb(null, markers);
        }
      });
    } else {

      var minLat = Math.min(topLeftLatitude + 90, bottomRightLatitude + 90) - 90;
      var maxLat = Math.max(topLeftLatitude + 90, bottomRightLatitude + 90) - 90;

      var minLng = Math.min(topLeftLongitude + 180, bottomRightLongitude + 180) - 180;
      var maxLng = Math.max(topLeftLongitude + 180, bottomRightLongitude + 180) - 180;

      // we can do no-caching here
      app.models.marker.find({ geo: { geoWithin: { box: [[minLng, minLat],[maxLng,maxLat]] }}}, function(err, markers) {
        if(err) {
          return cb(err);
        }

        if(markers) {

          var clusteredMarkers = app.geo.clusterify(markers, zoom);

          return cb(null, clusteredMarkers);
        }
      });

      return;



      var cellTopLeft = app.geo.getCell({lat: topLeftLatitude, lng: topLeftLongitude}, zoom);
      var cellBottomRight = app.geo.getCell({ lat: bottomRightLatitude, lng: bottomRightLongitude}, zoom);
      var markers = [];

      var adjacentCells = app.geo.getCellsInSquare(cellTopLeft, cellBottomRight);

      async.each(adjacentCells, function(adjacentCell, cb) {
        app.geo.getCellInfo(adjacentCell, function(err, pointInfo) {
          if(pointInfo) {
            markers.push({
              is_clustered: true,
              count: pointInfo.points,
              location: {
                lat:pointInfo.lat,
                lng:pointInfo.lng
              }
            });
          }
          cb();
        });
      }, function(err, results) {
        return cb(null, markers);
      });
    }
  };

  Marker.remoteMethod('mapbox', {
    description: 'Get markers in mapbox',
    accepts: [
      {arg: 'topLeftLat', type: "number", required: true, http: {source: 'query'}},
      {arg: 'topLeftLng', type: "number", required: true, http: {source: 'query'}},
      {arg: 'bottomRightLat', type: "number", required: true, http: {source: 'query'}},
      {arg: 'bottomRightLng', type: "number", required: true, http: {source: 'query'}},
      {arg: 'zoom', type: "integer", required: true, http: {source: 'query'}}
    ],
    returns: {
      arg: 'markers', type: ['marker'], root: true
    },
    accessType: 'READ',
    http: {verb: 'get', path: '/mapbox'}
  });

};

