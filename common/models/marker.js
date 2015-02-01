var app = require('./../../server/server');
var loopback = require('loopback');
var _ = require('lodash');
var async = require('async');

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
    modelInstance.user_id = currentUser.id;

    //TODO replace with findByUserId
    app.models.marker.find({user_id:currentUser.id}, function(err, marker) {
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


  Marker.afterSave = function(next) {
    var modelInstance = this;

    // we should update grid cache
    for(var zoom = 0; zoom <= MAX_CACHE_ZOOM; zoom++) {
      var cell = app.geo.getCell(modelInstance.location, zoom);
      app.geo.addCellPoint(cell, modelInstance.location);
    }
    next();
  };

  Marker.afterDestroy = function(next) {
    var modelInstance = this;

    // we should update grid cache
    for(var zoom = 0; zoom <= MAX_CACHE_ZOOM; zoom++) {
      var cell = app.geo.getCell(modelInstance.location, zoom);
      app.geo.removeCellPoint(cell, modelInstance.location);
    }
    next();
  };

  Marker.nearby = function(location, zoom, cb) {
    if(zoom >= app.geo.MAX_CACHED_ZOOM ) {

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

      var cell = app.geo.getCell(location, zoom);
      var markers = [];
      var distance = ((zoom+1)*4.5 |0);
      console.log(distance);

      var adjacentCells = app.geo.getAdjacentCells(cell, distance);

      async.eachSeries(adjacentCells, function(adjacentCell, cb) {
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
      }, function(err) {
        return cb(null, markers);
      });
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

