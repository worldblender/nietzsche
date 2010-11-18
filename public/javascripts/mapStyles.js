if (typeof MapStyles === "undefined") {
  MapStyles = {};
}

MapStyles.tron = [{
  featureType: "water",
  elementType: "all",
  stylers: [
    { lightness: 36 }
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
    { gamma: 0.39 },
    { lightness: -4 },
    { saturation: 100 }
  ]
},{
  featureType: "landscape.man_made",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
},{
  featureType: "all",
  elementType: "all",
  stylers: [
    { invert_lightness: true }
  ]
},{
  featureType: "poi",
  elementType: "all",
  stylers: [
    { visibility: "off" }
  ]
}];
