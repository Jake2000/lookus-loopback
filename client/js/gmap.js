var map;
var markers = [];
var currentMarker = null;

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
      loadMarkers();
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }

  google.maps.event.addListener(map, 'click', function(event) {
    if(currentMarker) {
      if(!currentMarker.attached) {
        currentMarker.setMap(null);
        currentMarker = null;
      }
    }

    currentMarker = new google.maps.Marker({
      position: event.latLng,
      map: map
    });

    $('#save-marker').removeAttr('disabled');

  });
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
  markers = [];
}

function placeMarker(marker) {
  if($('#map-canvas').length>0) {
    var gMarker = new google.maps.Marker({
      position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
      map: map
    });

    markers.push(gMarker);
  }
}

function saveCurrentMarker() {
  if(!currentMarker)
    return;

  var marker = {
    "life_time": 1523,
    "type": 1,
    "text": "hello",
    "image_url": "/images/blank.jpg",
    "image_preview_url": "/images/blank.jpg",
    "is_up": false,
    "location": {
      "lat": currentMarker.position.lat(),
      "lng": currentMarker.position.lng()
    }
  };

  var accessToken = app.access_token;

  $.ajax({
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    url:'/api/markers?access_token='+accessToken,
    data: JSON.stringify(marker),
    success: function(data) {
      markers.push(currentMarker);
      currentMarker.attached = true;
      $('#save-marker').attr('disabled', "disabled");
    },
    error: function(err) {
      if(err.responseJSON && err.responseJSON.error) {
        //alert(err.responseJSON.error.message);
        $('.main-error-block').html(err.responseJSON.error.message);
        $('.main-error-block').show();
      }
    }
  });
}

function loadMarkers() {

  var query = 'zoom=' + map.zoom;
  query += '&lat=' + map.getCenter().lat();
  query += '&lng=' + map.getCenter().lng();

  $.ajax({
    type: 'GET',
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    url:'/api/markers/nearby?'+query,
    success: function(data) {
      clearMarkers();
      if(_.isArray(data)) {
        _.forEach(data, function(marker) {
          if(marker.is_clustered) {
            var gClMarker = new google.maps.Marker({
              position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
              map: map,
              icon: '/images/marker_cluster.png',
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
}

function loadMarkersMapsbox() {

  var query = 'zoom=' + map.zoom;
  query += '&topLeftLat=' + map.getBounds().getNorthEast().lat();
  query += '&topLeftLng=' + map.getBounds().getNorthEast().lng();
  query += '&bottomRightLat=' + map.getBounds().getSouthWest().lat();
  query += '&bottomRightLng=' + map.getBounds().getSouthWest().lng();

  $.ajax({
    type: 'GET',
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    url:'/api/markers/mapbox?'+query,
    success: function(data) {
      clearMarkers();
      if(_.isArray(data)) {
        _.forEach(data, function(marker) {
          if(marker.is_clustered) {
            var gClMarker = new google.maps.Marker({
              position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
              map: map,
              icon: '/images/marker_cluster.png',
              title: "count:" + (marker.count || "0")
            });
            markers.push(gClMarker);
          } else {
            var gMarker = new google.maps.Marker({
              position: new google.maps.LatLng(marker.location.lat, marker.location.lng),
              map: map,
              title: (marker.text || "text")
            });
            markers.push(gMarker);
          }
        });
      }
    }
  });
}

$(function(){
  if($('#map-canvas').length>0) {
    initialize();

    $('#load-markers').on('click', function() {
      loadMarkers();
    });

    $('#save-marker').on('click', function() {
      saveCurrentMarker();
    });

    google.maps.event.addListener(map, 'bounds_changed', _.debounce(function() {
      loadMarkersMapsbox();
    }, 1000));
  }
});
