var mongodb = require('mongodb');
var util = require('util');

var default_port = mongodb.Connection.DEFAULT_PORT;
var db = new mongodb.Db(APP_NAME, new mongodb.Server('localhost', default_port, {}), {native_parser: true});

// global configs
INITIAL_HP = 100;
SHIELD_ENERGY = 100;
LANDMINE_RADIUS = 200; // in meters
LANDMINE_DAMAGE = 20;
MISSILE_RADIUS = 400; // in meters
MISSILE_DAMAGE = 40;
MISSILE_VELOCITY = 20; // TODO(jeff): 2 is the value we'll have in production
MISSILE_ACCELERATION = 0.0868; // TODO(jeff): divide by 10 for production

// physical constants
var RAD_TO_METERS = 6371 * 1000;

// connect to mongodb
db.open(function(err, db) {
  console.log("connected to mongodb");
});

// useful functions

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nameGenerator() {
  var firstWord = ["Fuzzy", "Sticky", "Hot", "Fast", "Quick", "Lazy", "Crazy", "Easy", "Cold", "Valley", "Evening", "Morning", "Dirty"];
  var secondWord = ["Hippie", "Feet", "Gun", "Shooter", "Boss", "Nerd", "Geek", "Dork", "Runner", "Driver", "Spy", "Clown"];
  return "Agent" + randomItem(firstWord) + randomItem(secondWord);
}

function haversineDistance(coords1, coords2) {
  var dLat = (coords2.lat-coords1.lat) * Math.PI / 180;
  var dLon = (coords2.lng-coords1.lng) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = RAD_TO_METERS * c;
  return d;  
}

function noCallback(err, p) {};

// Models
exports.Coords = function(lng, lat) {
  this.lng = lng;
  this.lat = lat;
}

exports.Missile = function(uid, arrivalCoords, socket, callback) {
  var m = this;
  m.owner = uid;
  m.departureTime = (new Date()).getTime() + 0.01; // hack of adding 0.01 to force storing in mongodb as float, so that util.inspect will read it out properly
  m.arrivalCoords = arrivalCoords; // TODO(jeff): check validity
  db.players.findOne({_id: uid}, function(err, document) {
    if (!document)
      return;
    if (err)
      console.log("Error: Could not create missile. Missile owner: " + uid + " err: " + util.inspect(err));
    // TODO(jeff): another race condition here. player launching 2 missiles at the same time might get them both launched
    for (var i = 0; i < document.items.m.m.length; i++) {
      if (document.items.m.m[i] == null) {
        m.departureCoords = document.coords;

        var distance = haversineDistance(m.arrivalCoords, m.departureCoords);
        var duration = (-MISSILE_VELOCITY + Math.sqrt(MISSILE_VELOCITY * MISSILE_VELOCITY + 2 * MISSILE_ACCELERATION * distance)) / MISSILE_ACCELERATION;
        m.arrivalTime = m.departureTime + duration * 1000;

        db.missiles.insert(m, function(err, docs) {
          setTimeout(function() {missileArrived(docs[0], socket);}, m.arrivalTime - (new Date()).getTime());
          // put this id in there
          document.items.m.m[i] = docs[0]._id;
          db.players.save(document, noCallback);
          db.events.insert({e: "missile", uid: uid, data: arrivalCoords}, noCallback);
        });
        callback(m);
        break; // found an available missile slot and used it, stop looking
      }
    }
  });
}

exports.init = function(uid, coords, initCallback, moveCallback) {
  var newPlayer = {
    _id: uid,
    hp: INITIAL_HP,
    gxp: 0,
    coords: coords,
//    items: { m: { r: MISSILE_RADIUS, d: MISSILE_DAMAGE, m: [null, null, null] }, l: { r: LANDMINE_RADIUS, d: LANDMINE_DAMAGE }, s: {e: SHIELD_ENERGY, a: 0}, c: 5 },
    items: { m: { r: MISSILE_RADIUS, d: MISSILE_DAMAGE, m: [null, null, null] }, s: {e: SHIELD_ENERGY, a: 0}},
    aliveSince: (new Date()).getTime() + 0.01,
    name: nameGenerator()
  };
  db.players.findOne({_id: uid}, function(err, document) {
    if (document) {
      if (document.hp > 0) { // don't move if you're dead
        document.coords = coords;
        db.players.save(document, moveCallback);
        db.events.insert({e: "move", uid: uid, data: coords}, noCallback);
      } else {
        moveCallback();
      }
    } else {
      db.players.insert(newPlayer, initCallback);
      db.events.insert({e: "init", uid: uid, data: coords});
    }
  });
  return newPlayer;
}

exports.move = function(uid, newLocation, client) {
  // TODO(jeff): check validity of newLocation
  db.players.findOne({_id: uid}, function(err, document) {
    if (!document) {
      console.log("Error: called 'move' with invalid uid. uid: " + uid + " newLocation: " + newLocation);
      return;
    }
    if (document.hp <= 0) {
      console.log("Error: dead player wanted to 'move'. uid: " + uid + " newLocation: " + newLocation);
      return;
    }
    document.coords = newLocation;
    db.players.save(document, noCallback);
    db.events.insert({e: "move", uid: uid, data: newLocation}, noCallback);
  });
}

exports.newName = function(uid, name) {
  db.players.findOne({_id: uid}, function(err, document) {
    if (!document) {
      console.log("Error: called 'newName' with invalid uid. uid: " + uid + " name: " + name);
      return;
    }
    document.name = name;
    db.players.save(document, noCallback);
  });
}

exports.events = function(uid, callback) {
  db.events.find({uid: uid, e: {$nin: ["move", "init"]}}, {sort: [['_id', -1]], limit: 15}, function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback({e: "events", events: results});
    });
  });
}

function getAllPlayers(callback) {
  db.players.find(function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback(err, results);
    });
  });
}

function getAllMissiles(callback) {
  db.missiles.find({arrivalTime: {$gt: (new Date()).getTime()}}, function(err, cursor) {
    cursor.toArray(function(err, results) {
      callback(err, results);
    });
  });
}

exports.sync = function(client, uid) {
  // TODO(jeff): change this to send only missiles that are en route and in the vicinity, and players that are in the vicinity
  getAllMissiles(function(err, missileResults) {
    getAllPlayers(function(err, playerResults) {
      var playerDict = {};
      for (var i in playerResults) {
        var document = playerResults[i];
        if (document._id === uid) {
          if (document.items.s.a === 1 && document.items.s.t) {
            document.items.s.e -= Math.ceil(((new Date()).getTime() - document.items.s.t) / 1000);
            if (document.items.s.e < 0)
              document.items.s.e = 0;
          } else if (document.items.s.a === 0 && document.items.s.t) {
            document.items.s.e += Math.floor(((new Date()).getTime() - document.items.s.t) / 1000);
            if (document.items.s.e > 100)
              document.items.s.e = 100;
          }
          document.items.s.t = (new Date()).getTime() + 0.01;
        }
        playerDict[document._id] = document;
        if (document._id !== uid)
          delete playerDict[document._id].items;
      }
      client.send({ e: "sync", missiles: missileResults, players: playerDict, time: (new Date()).getTime() });
      console.log({ missiles: missileResults, players: playerDict, approxTime: (new Date()).getTime() });
    });
  });
};

function calcDamage(damagedPlayer, damage, attacker, dmg, socket) {
  console.log("calcDamage: " + attacker._id + " did " + damage + " damage to " + damagedPlayer._id);
  if (damagedPlayer.hp <= 0)
    return;
  var old_hp = damagedPlayer.hp;
  var old_shield_e = damagedPlayer.items.s.e;
  var sdamage = 0;
  if (damagedPlayer.items.s.a === 1) {
    damagedPlayer.items.s.e -= Math.ceil(((new Date()).getTime() - damagedPlayer.items.s.t) / 1000);
    if (damagedPlayer.items.s.e < 0)
      damagedPlayer.items.s.e = 0;
    damagedPlayer.items.s.t = (new Date()).getTime() + 0.01;
    if (damagedPlayer.items.s.e >= damage) {
      damagedPlayer.items.s.e -= damage;
      sdamage = damage;
      damage = 0;
    } else {
      damage -= damagedPlayer.items.s.e;
      sdamage = damagedPlayer.items.s.e;
      damagedPlayer.items.s.e = 0;
    }
  }
  damagedPlayer.hp -= damage;
  if (damagedPlayer.hp <= 0) {
    damagedPlayer.hp = 0;
    damagedPlayer.aliveSince = null;
  }
  dmg.push({player: damagedPlayer._id, dmg: damage, sDmg: sdamage}); // TODO(jeff): this does not fix the race condition! BUG
  db.players.update({_id: damagedPlayer._id, hp: old_hp, "items.s.e": old_shield_e}, damagedPlayer, {safe: true}, function(err, result) {
    if (err) {
      console.log("Race condition, retrying. update result: " + util.inspect(result) + "  |  update err: " + util.inspect(err));
      db.players.findOne({_id: damagedPlayer._id}, function(err, document) {
        calcDamage(document, damage, attacker, dmg, socket);
      });
    } else {
      if (damagedPlayer.hp === 0 && damagedPlayer._id !== attacker._id) { // gained a kill if you didn't kill yourself
        db.players.update({_id: attacker._id}, {$inc: {gxp: 100}});
        socket.broadcast({e: "gxp", uid: attacker._id, gxp: 100});
        db.events.insert({e: "kill", uid: attacker._id, data: damagedPlayer._id}, noCallback);
        db.events.insert({e: "killed", uid: damagedPlayer._id, data: attacker._id}, noCallback); // redundant but nice
      }
      //console.log("Pushing damage " + damage + " on " + damagedPlayer._id);
      db.events.insert({e: "damaged", uid: damagedPlayer._id, data: {dmg: damage, sDmg: sdamage}}, noCallback); // redundant but nice
    }
  });
}

function missileArrived(missile, socket) {
  db.players.findOne({_id: missile.owner}, function(err, document) {
    for (var i = 0; i < document.items.m.m.length; ++i) {
      if (document.items.m.m[i] !== null && missile._id.str === document.items.m.m[i].str) {
        document.items.m.m[i] = null;
      }
    }
    db.players.save(document, noCallback);
    db.executeDbCommand({geoNear: "players", near: missile.arrivalCoords, maxDistance: MISSILE_RADIUS / RAD_TO_METERS, spherical: true}, function(err, result) {
      var dmg = [];
      for (var i = 0; i < result.documents[0].results.length; ++i) {
        //console.log("Going through player " + i);
        var obj = result.documents[0].results[i].obj;
        var damage = Math.ceil(document.items.m.d * (document.items.m.r - result.documents[0].results[i].dis * RAD_TO_METERS) / document.items.m.r);
        calcDamage(obj, damage, document, dmg, socket);
      }
      //console.log("DEBUG dmg: " + util.inspect(dmg));
      if (dmg.length > 0) {
        socket.broadcast({e: "damage", damage: dmg});
        db.events.insert({e: "damage", uid: missile.owner, data: dmg}, noCallback);
      }
    });
  });
}

exports.respawn = function(uid, callback) {
  db.players.findOne({_id: uid}, function(err, document) {
    document.hp = INITIAL_HP;
    document.aliveSince = (new Date()).getTime() + 0.01;
    document.items.m.m = [null, null, null];
    document.items.s = {e: SHIELD_ENERGY, a: 0};
    db.players.save(document, callback);
    db.events.insert({e: "respawn", uid: uid}, noCallback);
  });
}

exports.shield = function(uid, active) {
  db.players.findOne({_id: uid}, function(err, document) {
    if (!document) {
      console.log("Error: called 'shield' with invalid uid. uid: " + uid);
      return;
    }
    if (document.items.s.a === 1 && active === 0 && document.items.s.t) {
      document.items.s.e -= Math.ceil(((new Date()).getTime() - document.items.s.t) / 1000);
      if (document.items.s.e < 0)
        document.items.s.e = 0;
    } else if (document.items.s.a === 0 && active === 1 && document.items.s.t) {
      document.items.s.e += Math.floor(((new Date()).getTime() - document.items.s.t) / 1000);
      if (document.items.s.e > 100)
        document.items.s.e = 100;
    }
    document.items.s.t = (new Date()).getTime() + 0.01;
    document.items.s.a = active;
    db.players.save(document, noCallback);
    db.events.insert({e: "shield", uid: uid, active: active}, noCallback);
  });
}

exports.initializeDb = function() {
  // initialize the collection objects
  db.collection('players', function(err, collection) {
    db.players = collection;
  });
  db.collection('missiles', function(err, collection) {
    db.missiles = collection;
  });
  db.collection('events', function(err, collection) {
    db.events = collection;
  });
}

exports.resetDb = function() {
  db.dropDatabase(function() {
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
    db.collection('events', function(err, collection) {
      db.events = collection;
      // create events index
      db.events.createIndex([['e', 1], ['uid', 1]], noCallback);
    });
  });
}
