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

// socket.io
// TODO(jeff): compress/pack the socket.io .js file
// TODO(jeff): why does it say the conection is ready twice?
var socket = io.listen(app);
socket.on('connection', function(client) {
  console.log('socket.io connection: ' + client.sessionId);
  client.on('message', function(obj) {
    console.log("message: " + util.inspect(obj));
    if (obj.e === "init") {
      var p = new models.Player(client.sessionId, new models.Coords(obj.loc.ta, obj.loc.sa), function(err, docs) {
        // TODO(jeff): change this to send only missiles that are en route and in the vicinity, and players that are in the vicinity
        models.Missile.prototype.all(function(err, missileResults) {
          models.Player.prototype.all(function(err, playerResults) {
            var currentPlayer;
            for (var i = 0; i < playerResults.length; ++i) {
              if (playerResults[i]._id === client.sessionId) {
                //console.log("current player is index: " + i);
                currentPlayer = i;
                break;
              }
            }
            client.send({ missiles: missileResults, players: playerResults, youIndex: currentPlayer });
            console.log({ missiles: missileResults, players: playerResults, youIndex: currentPlayer });
          });
        });
      });
    } else if (obj.e === "m") {
      var m = new models.Missile(client.sessionId, new models.Coords(obj.loc.ta, obj.loc.sa)); // TODO(jeff): catch errors like player has no missiles to launch, then send an error msg back to the client
    } else if (obj.e === "move") {
    }
  });
  client.on('disconnect', function() {
    console.log('socket.io disconnect');
  });
});
