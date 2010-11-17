var mongodb = require('mongodb');
var util = require('util');

var app = require('./app');

var default_port = mongodb.Connection.DEFAULT_PORT;
var db = new mongodb.Db(APP_NAME, new mongodb.Server('localhost', default_port, {}), {native_parser: true});

// global configs
INITIAL_HP = 100;
MISSILE_RADIUS = 300; // in meters
MISSILE_VELOCITY = 200; // TODO(jeff): 2 is the value we'll have in production
MISSILE_ACCELERATION = 0.00868;

// physical constants
var RAD_TO_METERS = 6371 * 1000;

// connect to mongodb
db.open(function(err, db) {
  console.log("connected to mongodb");
});

// useful functions

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

exports.Player = function(username, coords, callback) {
  this._id = username; // TODO(jeff): check uniqueness
  this.hp = INITIAL_HP;
  this.coords = coords; // TODO(jeff): check validity
  this.items = {'m1': (new Date()).getTime() - 0.01, 'h1': 1, 'coins': 5}; // items are things you have. m1 is your primary missile, h1 is a health pack. the value is the time when you can use it again (for missiles), or how many you have (coins, health pack)
  this.aliveSince = (new Date()).getTime() + 0.01;
  db.players.insert(this, callback);
}

exports.Missile = function(username, arrivalCoords) {
  this.owner = username;
  var m = this;
  m.departureTime = (new Date()).getTime() + 0.01; // hack of adding 0.01 to force storing in mongodb as float, so that util.inspect will read it out properly
  m.arrivalCoords = arrivalCoords; // TODO(jeff): check validity
  db.players.findOne({_id: username}, function(err, document) {
    // TODO(jeff): check for error
    m.departureCoords = document.coords;

    var distance = haversineDistance(m.arrivalCoords, m.departureCoords);
    var duration = (-MISSILE_VELOCITY + Math.sqrt(MISSILE_VELOCITY * MISSILE_VELOCITY + 2 * MISSILE_ACCELERATION * distance)) / MISSILE_ACCELERATION;
    m.arrivalTime = m.departureTime + duration * 1000;

    db.missiles.insert(m, function(err, docs) {
      //console.log("lauched missile; " + printObject(m));
      setTimeout(function() {missileArrived(docs[0]);}, m.arrivalTime - (new Date()).getTime());
    });
  });
}

exports.Player.prototype.move = function(newCoords) {
  this.coords = newCoords; // TODO(jeff): check validity
}

exports.Player.prototype.all = function(callback) {
  db.players.find(function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback(err, results);
    });
  });
}

exports.Missile.prototype.all = function(callback) {
  db.missiles.find(function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback(err, results);
    });
  });
}

function missileArrived(missile) {
  //console.log("missile has arrived: " + missile);
  //console.log({geoNear: "players", near: missile.arrivalCoords, spherical:true});
  db.executeDbCommand({geoNear: "players", near: missile.arrivalCoords, maxDistance: MISSILE_RADIUS / RAD_TO_METERS, spherical: true}, function(err, result) {
    for (var i = 0; i < result.documents[0].results.length; ++i) {
      // TODO(jeff): race condition :-(   use findAndModify in the future
      var obj = result.documents[0].results[i].obj;
      var damage = Math.ceil(INITIAL_HP * (MISSILE_RADIUS - result.documents[0].results[i].dis * RAD_TO_METERS) / MISSILE_RADIUS);
      obj.hp -= damage;
      db.players.save(obj, noCallback);
    }
  });
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
