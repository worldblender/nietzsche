// Run $ expresso

/**
 * Module dependencies.
 */

var app = require('../app');
var models = require('../models');

// stupid mongodb remains open and so tests don't terminate without the hack in models.js

setTimeout(function() {
  models.clearDb();
  models.initializeDb();
}, 1000);

console.log("Waiting 2 seconds for initializations to complete");

setTimeout(function() {

  console.log("Starting tests...");

  exports.players = function(assert) {
    var p, m;
    p = new models.Player("jeff", new models.Coords(-122.328472, 47.622682));
    m = new models.Missile("jeff", new models.Coords(-122.327099, 47.605006));
    p = new models.Player("coffee1", new models.Coords(-122.329779, 47.604359));
    p = new models.Player("coffee2", new models.Coords(-122.329798, 47.604402));
    p = new models.Player("coffee3", new models.Coords(-122.329599, 47.602469));
    p = new models.Player("coffee4", new models.Coords(-122.330905, 47.604007));
    p = new models.Player("coffee5", new models.Coords(-122.33046, 47.60506));
    p = new models.Player("coffee6", new models.Coords(-122.331462, 47.602865));
    p = new models.Player("coffee7", new models.Coords(-122.329689, 47.60146));
    p = new models.Player("coffee8", new models.Coords(-122.332252, 47.603602));
    m = new models.Missile("coffee3", new models.Coords(-122.327093, 47.605002));
    m = new models.Missile("coffee3", new models.Coords(-122.324099, 47.605106));
    m = new models.Missile("coffee6", new models.Coords(-122.337099, 47.602006));
    p.move(new models.Coords(-122.31923, 47.603283));
  };
  exports.indexPage = function(assert) {
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
          assert.includes(res.body, '<title>Express</title>');
      });
  };

}, 2000);
