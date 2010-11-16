APP_NAME = 'nietzsche';

/**
 * Module dependencies.
 */

var express = require('express');
var util = require('util');
var app = module.exports = express.createServer(express.logger(), express.cookieDecoder(), express.session());

var models = require('./models');

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
  app.set('view options', { layout: false });
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  models.Missile.prototype.all(function(err, missileResults) {
    if (!req.session.id) {
      var newSessionId = Math.random().toString();
      var p = new models.Player(newSessionId, new models.Coords(0, 0), function(err, docs) {
        //models.Player.prototype.findOne({_id: newSessionId}, function(err, document) {
        req.session.id = newSessionId;
        models.Player.prototype.all(function(err, playerResults) {
          res.render('index.ejs', {
            locals: {
              MISSILE_RADIUS: MISSILE_RADIUS,
              MISSILE_VELOCITY: MISSILE_VELOCITY,
              MISSILE_ACCELERATION: MISSILE_ACCELERATION,
              APP_NAME: APP_NAME,
              players: util.inspect(playerResults),
              missiles: util.inspect(missileResults),
              current_user: req.session.id
            }
          });
        });
      });
    } else {
      // TODO(jeff): remove duplicate code
      models.Player.prototype.all(function(err, playerResults) {
        res.render('index.ejs', {
          locals: {
            MISSILE_RADIUS: MISSILE_RADIUS,
            MISSILE_VELOCITY: MISSILE_VELOCITY,
            MISSILE_ACCELERATION: MISSILE_ACCELERATION,
            APP_NAME: APP_NAME,
            players: util.inspect(playerResults),
            missiles: util.inspect(missileResults),
            current_user: req.session.id
          }
        });
      });
    }
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(80);
  console.log("Express server listening on port %d", app.address().port)
  models.clearDb();
  models.initializeDb();
}
