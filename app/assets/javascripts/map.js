$( document ).ready(function() {
  // Need to add conditions for failure
  function get_location(location) {
    navigator.geolocation.getCurrentPosition(show_map);
  };

  function show_map(loc) {
    window.user_latitude = loc.coords.latitude;
    window.user_longitude = loc.coords.longitude
  };

  get_location(location);

  var directionsDisplay;
  var directionsService = new google.maps.DirectionsService();

  function initialize() {
    // supressed directions marker icons here, could theoritcally make custom ones, but I think it'll be busy in addition to place markers
    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});

    var center = { lat: stops[0].latitude, lng: stops[0].longitude };
    var mapOptions = {
      center: center,
      zoom: 14
    };

    var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    var icon = "http://icons.iconarchive.com/icons/poison/native-american/32/American-Bison-icon.png"

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('directions-text'));

    tour_data.forEach(function(stop) {

      var marker = new google.maps.Marker({
          position: new google.maps.LatLng(stop.latitude, stop.longitude),
          map: map,
          icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8.5,
              fillColor: "#F00",
              fillOpacity: 0.4,
              strokeWeight: 0.4
          },
      });

      google.maps.event.addDomListener(document.getElementById(stop.div_id), 'click', function () {
        map.setCenter(new google.maps.LatLng(stop.latitude, stop.longitude));
        // This will reset the directions panel if you click on another stop, not sure if I want to do this though
        // document.getElementById("directions-text").innerHTML = "";
      });

      var infowindow = new google.maps.InfoWindow({
        content: '<div>' + stop.description + '</div>'
      });

      google.maps.event.addListener(marker, 'click', function() {
        map.setCenter(marker.getPosition());
      });
    });
  }


  function calc_route_to_start() {
    var start = new google.maps.LatLng(user_latitude, user_longitude);
    var end = new google.maps.LatLng(stops[0].latitude, stops[0].longitude);

    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      }
    });
  };

  function calc_total_route() {
    var x = location.href
    var start = new google.maps.LatLng(stops[0].latitude, stops[0].longitude);
    var end = new google.maps.LatLng(stops[stops.length - 1].latitude, stops[stops.length - 1].longitude);
    var waypts = [];
    // loop over all destinations except start and end. For each push the destination into a new point
    tour_data.forEach(function(stop) {
      waypts.push({
              location:new google.maps.LatLng(stop.latitude, stop.longitude),
              stopover:true});
    });

    var request = {
        origin: start,
        waypoints: waypts,
        destination: end,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.WALKING
    };

    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        leg_durations = []

        // I need to loop through the response and create an array of durations
        response.routes[0].legs.forEach(function(duration) {
            leg_durations.push(duration.duration);
        });

        $.ajax({
          method: 'PUT',
          url: x,
          data: { tour_legs: leg_durations },
          dataType: 'json'
        });
      }
    });
  };

  function calc_route(start_lat, start_long, end_lat, end_long) {
   var start = new google.maps.LatLng(start_lat, start_long);
   var end = new google.maps.LatLng(end_lat, end_long);

   var request = {
       origin: start,
       destination: end,
       travelMode: google.maps.TravelMode.WALKING
   };

   directionsService.route(request, function(response, status) {
     if (status == google.maps.DirectionsStatus.OK) {
       directionsDisplay.setDirections(response);
     }
   });
  };

  google.maps.event.addDomListener(window, 'load', initialize);

  $("#" + tour_data[0].div_id + '_directions').click(function() {
    calc_route_to_start();
  });

  // This loop both declares which divs should trigger calcRoute, and passes in the parameters that calcRoute will use
  tour_data.forEach(function(stop) {
    $("#" + stop.div_id + "_directions").click(function() {
      calc_route(stop.latitude, stop.longitude, tour_data[(stop.stop_number)].latitude, tour_data[(stop.stop_number)].longitude);
    });
  });

  calc_total_route();
});
