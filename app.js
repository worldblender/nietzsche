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
//  app.use(express.gzip()); TODO(jeff): I can get big wins from using gzip compression, but sencha_touch.js doesn't load if I do  (clear web browser history first) for some reason
  app.use(express.staticProvider(__dirname + '/public'));
});

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nameGenerator() {
  var firstWord = ["Fuzzy", "Sticky", "Hot", "Fast", "Quick", "Lazy", "Crazy", "Easy", "Cold", "Valley", "Evening", "Morning"];
  var secondWord = ["Bear", "Feet", "Gun", "Shooter", "Boss", "Nerd", "Geek", "Dork", "Runner", "Driver", "Spy", "Clown"];
  return "Agent" + randomItem(firstWord) + randomItem(secondWord);
}

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(80);
  console.log("Express server listening on port %d", app.address().port)
  models.clearDb(); // TODO(Jeff): remove this in production version
  models.initializeDb();
}

function sync(client, uid) {
  // TODO(jeff): change this to send only missiles that are en route and in the vicinity, and players that are in the vicinity
  models.Missile.prototype.all(function(err, missileResults) {
    models.Player.prototype.all(function(err, playerResults) {
      var playerDict = {};
      for (var i in playerResults) {
        playerDict[playerResults[i]._id] = playerResults[i];
      }
      client.send({ e: "sync", missiles: missileResults, players: playerDict, time: (new Date()).getTime() });
      console.log({ missiles: missileResults, players: playerDict, approxTime: (new Date()).getTime() });
    });
  });
}

// socket.io
// TODO(jeff): compress/pack the socket.io .js file
// TODO(jeff): why does it say the conection is ready twice?
var socket = io.listen(app);
socket.on('connection', function(client) {
  console.log('socket.io connection: ' + client.sessionId);
  client.on('message', function(obj) {
    console.log("message: " + util.inspect(obj));
    if (obj.e === "init") {
      var p = new models.Player(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat), function(err, docs) {
        sync(client);
      });
      client.broadcast({e: "player", player: p}); // tell everyone else I am here
    } else if (obj.e === "m") {
      // TODO(jeff): catch errors like player has no missiles to launch, then send an error msg back to the client
      new models.Missile(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat), socket, function(m) {
        socket.broadcast({e: "missile", missile: m});
      });
    } else if (obj.e === "move") {
      models.move(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat));
      client.broadcast({player: obj.uid, e: "moved", loc: obj.loc});
    }
  });
  client.on('disconnect', function() {
    console.log('socket.io disconnect');
  });
});
