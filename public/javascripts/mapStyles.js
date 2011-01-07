if (typeof MapStyles === "undefined") {
  MapStyles = {};
}

MapStyles.tron = [{
  featureType: "water",
  elementType: "all",
  stylers: [
    { lightness: 16 }
  ]
},{
  featureType: "all",
  elementType: "all",
  stylers: [
    { invert_lightness: true }
  ]
},{
  featureType: "all",
  elementType: "labels",
  stylers: [
    { visibility: "off" }
  ]
},{
  featureType: "road",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
},{
  featureType: "road.highway",
  elementType: "all",
  stylers: [
    { visibility: "simplified" }
  ]
},{
  featureType: "transit",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
},{
  featureType: "administrative",
  elementType: "labels",
  stylers: [
    { visibility: "on" },
    { lightness: -40 }
  ]
},{
  featureType: "landscape.man_made",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
},{
  featureType: "poi",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
}];
