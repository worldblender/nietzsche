var mongodb = require('mongodb');

var app = require('./app');

var default_port = mongodb.Connection.DEFAULT_PORT;
var db = new mongodb.Db(APP_NAME, new mongodb.Server('localhost', default_port, {}), {native_parser: true});

var TODO_SECONDS = 5;
var MISSILE_RADIUS = 2000; // in meters

db.open(function(err, db) {
  console.log("connected to mongodb");
});

exports.clearDb = function() {
  db.dropDatabase(function(err, result) {});
};

// Models
exports.Coords = function(long, lat) {
  this.long = long;
  this.lat = lat;
}

var RAD_TO_METERS = 6371 * 1000;

exports.Player = function(username, coords) {
  this._id = username; // TODO(jeff): check uniqueness
  this.hp = 100;
  this.coords = coords; // TODO(jeff): check validity
  this.weapons = ['missile'];

  var p = this;
  db.players.insert(p);
}

exports.Missile = function(username, arrivalCoords) {
  this.owner = username;
  var m = this;
  m.departureTime = Date.parse(new Date());
  m.arrivalTime = m.departureTime + TODO_SECONDS * 1000;
  m.arrivalCoords = arrivalCoords; // TODO(jeff): check validity
  db.players.findOne({_id: username}, function(err, document) {
    // TODO(jeff): check for error
    m.departureCoords = document.coords;

    db.missiles.insert(m, function(err, docs) {
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
    console.log(result.documents[0].results[0].dis * RAD_TO_METERS);
  });
  /*db.players.find({coords: {$near: missile.arrivalCoords}, $maxDistance: MISSILE_RADIUS / RAD_TO_METERS}, function(err, cursor) {
    cursor.each(function(err, item) {
      if (item != null) {
        console.log(item);
      }
    });
  });*/
}

if (module.parent.parent && module.parent.parent.id.substr(-5) === ".test") {
  setTimeout(function() {console.log("Closing mongodb for test run"); db.close();}, 10000);
}

exports.initializeDb = function() {
  // initialize the collection objects
  db.collection('players', function(err, collection) {
    db.players = collection;
    // create players index
    db.players.createIndex([['coords', '2d']], function(err, indexName) {});
  });
  db.collection('missiles', function(err, collection) {
    db.missiles = collection;
    // create missiles index
    db.missiles.createIndex([['owner', 1]], function(err, indexName) {});
  });
}
