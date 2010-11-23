var mongodb = require('mongodb');
var util = require('util');

var app = require('./app');

var default_port = mongodb.Connection.DEFAULT_PORT;
var db = new mongodb.Db(APP_NAME, new mongodb.Server('localhost', default_port, {}), {native_parser: true});

// global configs
INITIAL_HP = 100;
LANDMINE_RADIUS = 200; // in meters
LANDMINE_DAMAGE = 20;
MISSILE_RADIUS = 400; // in meters
MISSILE_DAMAGE = 40;
MISSILE_VELOCITY = 20; // TODO(jeff): 2 is the value we'll have in production
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
  this.items = { m: { r: MISSILE_RADIUS, d: MISSILE_DAMAGE, m: [null, null, null] }, l: { r: LANDMINE_RADIUS, d: LANDMINE_DAMAGE }, c: 5 };
  this.aliveSince = (new Date()).getTime() + 0.01;
  db.players.insert(this, callback);
  return this;
}

exports.Missile = function(username, arrivalCoords, callback) {
  var m = this;
  m.owner = username;
  m.departureTime = (new Date()).getTime() + 0.01; // hack of adding 0.01 to force storing in mongodb as float, so that util.inspect will read it out properly
  m.arrivalCoords = arrivalCoords; // TODO(jeff): check validity
  db.players.findOne({_id: username}, function(err, document) {
    //console.log("missile being launched by: " + username);
    // TODO(jeff): check for error
    // TODO(jeff): another race condition here. player launching 2 missiles at the same time might get them both launched
    for (var i = 0; i < document.items.m.m.length; i++) {
      if (document.items.m.m[i] == null) {
        m.departureCoords = document.coords;

        var distance = haversineDistance(m.arrivalCoords, m.departureCoords);
        var duration = (-MISSILE_VELOCITY + Math.sqrt(MISSILE_VELOCITY * MISSILE_VELOCITY + 2 * MISSILE_ACCELERATION * distance)) / MISSILE_ACCELERATION;
        m.arrivalTime = m.departureTime + duration * 1000;

        db.missiles.insert(m, function(err, docs) {
          //console.log("lauched missile; " + printObject(m));
          setTimeout(function() {missileArrived(docs[0]);}, m.arrivalTime - (new Date()).getTime());
          // put this id in there
          document.items.m.m[i] = docs[0]._id;
          db.players.save(document, noCallback);
        });
        callback(m);
        break; // found an available missile slot and used it, stop looking
      }
    }
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
  db.missiles.find({arrivalTime: {$gt: (new Date()).getTime()}}, function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback(err, results);
    });
  });
}

function missileArrived(missile) {
  //console.log("missile has arrived: " + missile.arrivalCoords);
  //console.log({geoNear: "players", near: missile.arrivalCoords, spherical:true});
  db.players.findOne({_id: missile.owner}, function(err, document) {
    for (var i = 0; i < document.items.m.m.length; ++i) {
      if (document.items.m.m[i] !== null && missile._id.str === document.items.m.m[i].str) {
        document.items.m.m[i] = null;
        db.players.save(document, noCallback);
      }
    }
    db.executeDbCommand({geoNear: "players", near: missile.arrivalCoords, maxDistance: MISSILE_RADIUS / RAD_TO_METERS, spherical: true}, function(err, result) {
      for (var i = 0; i < result.documents[0].results.length; ++i) {
        // TODO(jeff): race condition :-(   use findAndModify in the future
        var obj = result.documents[0].results[i].obj;
        var damage = Math.ceil(document.items.m.d * (document.items.m.r - result.documents[0].results[i].dis * RAD_TO_METERS) / document.items.m.r);
        obj.hp -= damage;
        db.players.save(obj, noCallback);
      }
    });
  });
}

exports.initializeDb = function() {
  // initialize the collection objects
  db.collection('players', function(err, collection) {
    db.players = collection;
    // create players index
    db.players.createIndex([['coords', '2d']], noCallback); //TODO(jeff): move these createIndex functions to some db reset method
  });
  db.collection('missiles', function(err, collection) {
    db.missiles = collection;
    // create missiles index
    db.missiles.createIndex([['owner', 1]], noCallback);
  });
}
