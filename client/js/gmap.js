var map;
var markers = [];

function initialize() {
  var mapOptions = {
    zoom: 15
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);

  // Try HTML5 geolocation
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = new google.maps.LatLng(position.coords.latitude,
        position.coords.longitude);

      var infowindow = new google.maps.InfoWindow({
        map: map,
        position: pos,
        content: 'Location found using HTML5.'
      });

      map.setCenter(pos);
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }
}

function handleNoGeolocation(errorFlag) {
  if (errorFlag) {
    var content = 'Error: The Geolocation service failed.';
  } else {
    var content = 'Error: Your browser doesn\'t support geolocation.';
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}

function setAllMap(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function clearMarkers() {
  setAllMap(null);
}

function loadMarkers() {
  $.ajax({
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    url:'/api/markers/nearby?zoom='+map.zoom,
    data: JSON.stringify({ lat: map.getCenter().lat(), lng:map.getCenter().lng()}),
    success: function(data) {
      clearMarkers();
      if(_.isArray(data)) {
        _.forEach(data, function(marker) {
          if(marker.is_clustered) {
            var gClMarker = new google.maps.Marker({
              position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
              map: map,
              title: marker.count
            });
            markers.push(gClMarker);
          } else {
            var gMarker = new google.maps.Marker({
              position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
              map: map,
              title: marker.text
            });
            markers.push(gMarker);
          }
        });
      }
    }
  });
};

$(function(){
  initialize();

  $('#load-markers').on('click', function() {
    loadMarkers();
  });

  google.maps.event.addListener(map, 'zoom_changed', _.throttle(function() {
    loadMarkers();
  }, 300));
});
