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
    var p = new models.Player("jeff", new models.Coords(-122.328472, 47.622682));
    var m = new models.Missile("jeff", new models.Coords(-122.327099, 47.605006));
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
