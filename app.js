APP_NAME = 'nietzsche';

/**
 * Module dependencies.
 */

var express = require('express');
var util = require('util');
var io = require('socket.io');
var app = module.exports = express.createServer(express.logger(), express.cookieDecoder(), express.session());

var models = require('./models');

// Configuration

app.configure(function(){
//  app.use(express.gzip()); NOFIX(jeff): I can get big wins from using gzip compression, but sencha_touch.js doesn't load if I do (clear web browser history first) for some reason
  app.use(express.staticProvider(__dirname + '/public'));
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(80);
  console.log("Express server listening on port %d", app.address().port)
  models.resetDb(); // TODO(jeff): change this to initializeDb in production
}

function sync(client, uid) {
  // TODO(jeff): change this to send only missiles that are en route and in the vicinity, and players that are in the vicinity
  models.getAllMissiles(function(err, missileResults) {
    models.getAllPlayers(function(err, playerResults) {
      var playerDict = {};
      for (var i in playerResults) {
        playerDict[playerResults[i]._id] = playerResults[i];
        if (playerResults[i]._id !== uid)
          delete playerDict[playerResults[i]._id].items;
      }
      client.send({ e: "sync", missiles: missileResults, players: playerDict, time: (new Date()).getTime() });
      console.log({ missiles: missileResults, players: playerDict, approxTime: (new Date()).getTime() });
    });
  });
}

// socket.io
// TODO(jeff): compress/pack the socket.io .js file
// TODO(jeff): why does it say the connection is ready twice?
var socket = io.listen(app);
socket.on('connection', function(client) {
  console.log('socket.io connection: ' + client.sessionId);
  client.on('message', function(obj) {
    console.log("message: " + util.inspect(obj));
    if (obj.e === "init") {
      var p = models.init(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat), function() {
        sync(client, obj.uid);
        client.broadcast({e: "player", player: p});
      }, function(err, result) {
        sync(client, obj.uid);
        client.broadcast({player: obj.uid, e: "moved", loc: obj.loc});
      });
    } else if (obj.e === "m") {
      // TODO(jeff): catch errors like player has no missiles to launch, then send an error msg back to the client
      new models.Missile(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat), socket, function(m) {
        // TODO(jeff): only broadcast the missile if it was valid (otherwise players can cheat)
        socket.broadcast({e: "missile", missile: m});
      });
    } else if (obj.e === "move") {
      models.move(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat));
      client.broadcast({player: obj.uid, e: "moved", loc: obj.loc});
    } else if (obj.e === "name") {
      models.newName(obj.uid, obj.name);
    } else if (obj.e === "events") {
      models.events(obj.uid, function(events) {
        console.log("sending events: " + util.inspect(events));
        client.send(events);
      });
    } else if (obj.e === "respawn") {
      models.respawn(obj.uid, function(err, document) {
        socket.broadcast({e: "respawn", player: document});
      });
    }
  });
  client.on('disconnect', function() {
    console.log('socket.io disconnect');
  });
});
