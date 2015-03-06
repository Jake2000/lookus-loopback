var OFFSET = 268435456;
var RADIUS = 85445659.4471;
var PI =  3.141592653589793238462;

var lngToX = function(lng) {
  return Math.round(OFFSET + RADIUS * lng * PI / 180);
};

var latToY = function(lat) {
  return Math.round(OFFSET - RADIUS * Math.log((1 + Math.sin(lat * PI / 180)) / (1 - Math.sin(lat * PI / 180))) / 2);
};

var pixelDistance = function(lat1, lng1, lat2, lng2, zoom) {
  var x1 = lngToX(lng1);
  var y1 = latToY(lat1);

  var x2 = lngToX(lng2);
  var y2 = latToY(lat2);

  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));// >> (21 - zoom);
};

/**
 *
 * @param x1
 * @param x2
 * @param y1
 * @param y2
 * @param movePercent
 * @returns {{lng: number, lat: number}}
 */
var newClusterPoint =  function (x1, x2, y1, y2, movePercent) {
  var pixel = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));

  if(pixel == 0) {
    return {
      lng: x1,
      lat: y1
    };
  }

  var cosin = (x1 - x2) / pixel;
  var sinus = (y1 - y2) / pixel;
  var distanceMovePixel = pixel * movePercent;
  var newXMove = cosin * distanceMovePixel;
  var newYMove = sinus * distanceMovePixel;

  return {
    lng: x1 - newXMove,
    lat: y1 - newYMove
  };
};

/**
 * Create Clusters
 * @param markers
 * @param distance
 * @param zoom
 * @param moreThen
 * @return array
 */
var createCluster = function (markers, distance, zoom, moreThen) {
  zoom = zoom | 0;


  if (moreThen > 0) moreThen -= 1;
  if (moreThen < 0) moreThen = 0;

  var clustered = [];

  for (var i = 0; i < markers.length; i++ ) {

    var marker = markers.shift();
    if(!marker) {
      continue;
    }

    var cluster = 0;
    var clusterFinderIndex = [];
    var movePercent = 0.5;

    var clusterPoint = {
      lat: marker.location.lat,
      lng: marker.location.lng
    };

    for (var j = 0; j < markers.length; j++) {
      if(!markers[j]) {
        continue;
      }

      var pixel = pixelDistance(
        marker.location.lat,
        marker.location.lng,
        markers[j]['location']['lat'],
        markers[j]['location']['lng'],
        zoom
      );

      if (distance > pixel) {
        cluster ++;
        clusterFinderIndex.push(j);

        clusterPoint = newClusterPoint(
          clusterPoint.lng,
          markers[j]["location"]['lng'],
          clusterPoint.lat,
          markers[j]["location"]['lat'],
          movePercent
        );

        movePercent -= (movePercent * 0.03);
      }
    }

    if (cluster > moreThen) {

      for (var k = 0; k < clusterFinderIndex.length; k++) {
        delete markers[clusterFinderIndex[k]];
      }

      var clusterData = {
        count : cluster + 1,
        location : clusterPoint,
        is_clustered : true
      };

      clustered.push(clusterData);
    } else {
      clustered.push(marker);

    }

  }

  return clustered;
};

module.exports.createCluster = createCluster;
