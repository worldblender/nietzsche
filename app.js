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
  models.initializeDb();
}

// socket.io
var socketOptions = {
  transportOptions: { 
    'flashsocket': {
      closeTimeout: 1000000,
      timeout: 100000
    }, 'websocket': {
      closeTimeout: 1000000,
      timeout: 100000
    }, 'htmlfile': {
      closeTimeout: 1000000,
      timeout: 100000
    }, 'xhr-multipart': {
      closeTimeout: 1000000,
      timeout: 100000
    }, 'xhr-polling': {
      closeTimeout: 1000000,
      timeout: 100000
    }, 'jsonp-polling': {
      closeTimeout: 1000000,
      timeout: 100000
    }
  }
};
var socket = io.listen(app, socketOptions);
socket.on('connection', function(client) {
  client.on('message', function(obj) {
    console.log("message: " + util.inspect(obj));
    if (obj.e === "init") {
      var p = models.init(obj.uid, new models.Coords(obj.loc.lng, obj.loc.lat), function() {
        models.sync(client, obj.uid);
        client.broadcast({e: "player", player: p});
      }, function(err, result) {
        models.sync(client, obj.uid);
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
    } else if (obj.e === "shield") {
      models.shield(obj.uid, obj.active);
    } else if (obj.e === "say") {
      socket.broadcast(obj);
    }
  });
  client.on('disconnect', function() {
  });
});
