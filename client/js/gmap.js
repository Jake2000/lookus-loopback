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

  $.ajax({
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    url:'/api/markers?access_token=RrLgFyxVE0prUxVBx7gDcSLME3lYsqq86GDuZv3JJQ3bwKoWYVLpZAB58OiM8vaU',
    data: JSON.stringify(marker),
    success: function(data) {
      markers.push(currentMarker);
      currentMarker.attached = true;
    }
  });
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
}

$(function(){
  initialize();

  $('#load-markers').on('click', function() {
    loadMarkers();
  });

  $('#save-marker').on('click', function() {
    saveCurrentMarker();
  });

  google.maps.event.addListener(map, 'bounds_changed', _.debounce(function() {
    loadMarkers();
  }, 1000));
});
