var mongodb = require('mongodb');

var app = require('./app');

var default_port = mongodb.Connection.DEFAULT_PORT;
var db = new mongodb.Db(APP_NAME, new mongodb.Server('localhost', default_port, {}), {native_parser: true});

// configuration
var INITIAL_HP = 100;
var MISSILE_RADIUS = 300; // in meters
var MISSILE_VELOCITY = 2;
var MISSILE_ACCELERATION = 0.00868;

// physical constants
var RAD_TO_METERS = 6371 * 1000;

// connect to mongodb
db.open(function(err, db) {
  console.log("connected to mongodb");
});

// useful functions
function printObject(o) {
  var output = '';
  for (property in o) {
    output += property + ': ' + o[property]+'; ';
  }
  return output;
}

exports.clearDb = function() {
  db.dropDatabase(noCallback);
};

function haversineDistance(coords1, coords2) {
  var dLat = (coords2.lat-coords1.lat) * Math.PI / 180;
  var dLon = (coords2.long-coords1.long) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = RAD_TO_METERS * c;
  return d;  
}

function noCallback(err, p) {};

// Models
exports.Coords = function(long, lat) {
  this.long = long;
  this.lat = lat;
}

exports.Player = function(username, coords) {
  this._id = username; // TODO(jeff): check uniqueness
  this.hp = INITIAL_HP;
  this.coords = coords; // TODO(jeff): check validity
  this.weapons = ['missile'];
  db.players.insert(this);
}

exports.Missile = function(username, arrivalCoords) {
  this.owner = username;
  var m = this;
  m.departureTime = Date.parse(new Date());
  m.arrivalCoords = arrivalCoords; // TODO(jeff): check validity
  db.players.findOne({_id: username}, function(err, document) {
    // TODO(jeff): check for error
    m.departureCoords = document.coords;

    var distance = haversineDistance(m.arrivalCoords, m.departureCoords);
    var duration = (-MISSILE_VELOCITY + Math.sqrt(MISSILE_VELOCITY * MISSILE_VELOCITY + 2 * MISSILE_ACCELERATION * distance)) / MISSILE_ACCELERATION;
    m.arrivalTime = m.departureTime + duration * 1000;

    db.missiles.insert(m, function(err, docs) {
      console.log("lauched missile; " + printObject(m));
      setTimeout(function() {missileArrived(docs[0]);}, m.arrivalTime - Date.parse(new Date()));
    });
  });
}

exports.Player.prototype.move = function(newCoords) {
  this.coords = newCoords; // TODO(jeff): check validity
}

function missileArrived(missile) {
  console.log("missile has arrived: " + missile);
  //console.log({geoNear: "players", near: missile.arrivalCoords, spherical:true});
  db.executeDbCommand({geoNear: "players", near: missile.arrivalCoords, maxDistance: MISSILE_RADIUS / RAD_TO_METERS, spherical: true}, function(err, result) {
    console.log(result.documents[0].results);
  });
}

if (module.parent.parent && module.parent.parent.id.substr(-5) === ".test") {
  setTimeout(function() {console.log("Closing mongodb for test run"); db.close();}, 10000);
}

exports.initializeDb = function() {
  // initialize the collection objects
  db.collection('players', function(err, collection) {
    db.players = collection;
    // create players index
    db.players.createIndex([['coords', '2d']], noCallback);
  });
  db.collection('missiles', function(err, collection) {
    db.missiles = collection;
    // create missiles index
    db.missiles.createIndex([['owner', 1]], noCallback);
  });
}
