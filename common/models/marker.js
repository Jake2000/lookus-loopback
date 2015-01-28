var app = require('./../../server/server');

module.exports = function(Marker) {
  Marker.disableRemoteMethod('upsert', true);
  Marker.disableRemoteMethod('update', true);
  Marker.disableRemoteMethod('updateAll', true);
  Marker.disableRemoteMethod('exists', true);
  Marker.disableRemoteMethod('findOne', true);
  Marker.disableRemoteMethod('find', true);
  Marker.disableRemoteMethod('count', true);

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


  var getLatitudeCell = function(location, zoom) {
      var multiplier = 1;
      if(zoom == 1) {
        multiplier = 0.002
      }

      return (location.lat % multiplier) + ':z:'+(zoom|0)
  };

  var getLongitudeCell = function(location, zoom) {
    return location.lng/0.0003 + ':z:'+(zoom|0)
  };

  Marker.nearby = function(location, zoom, cb) {

    //var latCellKey = getLatitudeCell(location.lat, zoom);
    //var lngCellKey = getLongitudeCell(location.lat, zoom);

    //var key = latCellKey+':'+lngCellKey;
    console.log(key);

    //Marker.remember(key);

    //app.models.marker.find({""}, );


    cb(null);
  };

  Marker.remoteMethod('nearby',
    {
      description: 'Get nearby markers (implementation in progress)',
      accepts: [
        {arg: 'data', type: "location", required: true, http: {source: 'body'}}
      ],
      returns: {
        arg: 'markers', type: 'marker', root: true,
        description:
          'The response body contains array of markers.\n'
      },
      accessType: 'READ',
      http: {verb: 'get', path: '/nearby'}
    }
  );
};
