var target, targetListener, missileButton, landmineButton, worldMap, worldTopbar, allPlayers, allMissiles, populateMap, serverTimeDiff, tick, uid, reconnectBox, eventPane, yourLocation, attackButton, actionButtons, attackToggle, respawnButton;
var socket = new io.Socket();

TICK_INTERVAL = 700; // in ms
BLAST_SPEED = 16; // must be even

RAD_TO_METERS = 6371 * 1000;
MISSILE_RADIUS = 400; // in meters
MISSILE_DAMAGE = 40;
MISSILE_VELOCITY = 50; // TODO(jeff): 2 is the value we'll have in production
MISSILE_ACCELERATION = 0.0868; // TODO(jeff): divide by 10 for production

// TODO(Jeff): find a way to share this function between here and models.js
function haversineDistance(coords1, coords2) {
  var dLat = (coords2.lat-coords1.lat) * Math.PI / 180;
  var dLon = (coords2.lng-coords1.lng) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = RAD_TO_METERS * c;
  return d;  
}

function getRank(xp) {
  if (xp < 100)
    return "Trainee";
  else if (xp < 300)
    return "Rookie";
  else if (xp < 1000)
    return "Agent";
  else
    return "Professional";
}

function calcXP(player) {
  if (!player.aliveSince)
    return player.gxp; // aliveness XP is temporary?
  return Math.floor((serverTimeDiff + (new Date()).getTime() - player.aliveSince) / 60000) + player.gxp; // 1 XP per minute + gainedXP
}

function numReadyMissiles(m) {
  var readyMissiles = 0;
  for (var i = 0; i < m.length; ++i) {
    if (m[i] === null) {
      readyMissiles++;
    }
  }
  return readyMissiles;
}

function connectLoop() {
  if (socket.connected) {
    reconnectBox.hide();
  } else {
    setTimeout(connectLoop, 2000);
    socket.connect();
  }
}

function killed() {
  attackToggle(null, "Attack", false);
  actionButtons.setPressed(attackButton, false);
  attackButton.disable(true);
  worldTopbar.setTitle("You died");
  respawnButton.show();
}

function alive() {
  socket.send({e: "respawn", uid: uid});
}

function drawPlayer(i, dropAnimation) {
  if (!this.soldier)
    this.soldier = new google.maps.MarkerImage(
      "/images/soldier.png", 
      new google.maps.Size(24, 24),
      new google.maps.Point(0, 0),
      new google.maps.Point(12, 12)
    );
  if (!this.dead)
    this.dead = new google.maps.MarkerImage(
      "/images/dead.png", 
      new google.maps.Size(24, 24),
      new google.maps.Point(0, 0),
      new google.maps.Point(12, 12),
      new google.maps.Size(24, 24)
    );

  var plocation = new google.maps.LatLng(allPlayers[i].coords.lat, allPlayers[i].coords.lng);
  var dropAnim = null;
  if (dropAnimation)
    dropAnim = google.maps.Animation.DROP;
  //console.log("drawPlayer for " + i + " with hp=" + allPlayers[i].hp);
  if (allPlayers[i].hp > 0) {
    allPlayers[i].marker = new google.maps.Marker({
      position: plocation,
      map: worldMap.map,
      animation: dropAnim,
      icon: this.soldier
    });
    if (i === uid)
      allPlayers[i].marker.setAnimation(google.maps.Animation.BOUNCE);
  } else {
    allPlayers[i].marker = new google.maps.Marker({
      position: plocation,
      map: worldMap.map,
      icon: this.dead
    });
  }
  allPlayers[i].marker.info = allPlayers[i];
  google.maps.event.addListener(allPlayers[i].marker, 'click', function() {
    if (this.info.hp > 0) {
      Ext.Msg.alert(this.info.name, this.info.hp + "hp " + calcXP(this.info) + "xp");
    } else {
      Ext.Msg.alert(this.info.name, this.info.name + "'s remains lay here");
    }
  });
}

function drawMissile(i) {
  var missileProgress = ((serverTimeDiff + (new Date()).getTime() - allMissiles[i].departureTime) / (allMissiles[i].arrivalTime - allMissiles[i].departureTime));
  if (missileProgress > 1 || missileProgress < 0)
    return;
  var missileLine = [new google.maps.LatLng(allMissiles[i].departureCoords.lat,
                                            allMissiles[i].departureCoords.lng),
                     new google.maps.LatLng(allMissiles[i].departureCoords.lat + (allMissiles[i].arrivalCoords.lat - allMissiles[i].departureCoords.lat) * missileProgress,
                                            allMissiles[i].departureCoords.lng + (allMissiles[i].arrivalCoords.lng - allMissiles[i].departureCoords.lng) * missileProgress)];
  if (allMissiles[i].line) {
    allMissiles[i].line.setPath(missileLine); // TODO(jeff): the line is drawn off from the crosshair's center. is it because of the earth's spherical shape?
  } else {
    var missilePath = new google.maps.Polyline({
      path: missileLine,
      strokeColor: "#00FFFF",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      clickable: false
    });
    missilePath.setMap(worldMap.map);
    allMissiles[i].line = missilePath;
  }
}

uid = localStorage["uid"];
if (!uid) {
  uid = Math.random().toString().substring(2); // TODO(jeff): use the device.uuid from phonegap for mobile apps
  console.log("created new cookie: " + uid);
  localStorage["uid"] = uid;
} else {
  console.log("retrieved cookie: " + uid);
}

socket.on('message', function(obj) {
  console.log(obj);
  if (obj.e === "sync") {
    serverTimeDiff = obj.time - (new Date()).getTime();
    if (allPlayers) {
      for (var p = 0; p < allPlayers.length; ++p) {
        if (allPlayers[p].marker)
          allPlayers[p].marker.setMap(null);
      }
    }
    allPlayers = obj.players;
    if (allMissiles) {
      for (var m = 0; m < allMissiles.length; ++m) {
        if (allMissiles[m] && allMissiles[m].line)
          allMissiles[m].line.setMap(null);
      }
    }
    allMissiles = obj.missiles;
    if (allPlayers[uid].hp <= 0 && worldTopbar) {
      killed();
    }
    allPlayers[uid].readyMissiles = numReadyMissiles(allPlayers[uid].items.m.m);
    missileButton.setBadge(allPlayers[uid].readyMissiles);
    if (allPlayers[uid].readyMissiles === 0)
      missileButton.disable(true);
    populateMap();
    setInterval(tick, TICK_INTERVAL);
  } else if (obj.e === "player") {
    allPlayers[obj.player._id] = obj.player;
    drawPlayer(obj.player._id, true);
  } else if (obj.e === "missile") {
    var len = allMissiles.push(obj.missile);
  } else if (obj.e === "moved") {
    var movedLoc = new google.maps.LatLng(obj.loc.lat, obj.loc.lng);
    allPlayers[obj.player].coords = movedLoc;
    if (allPlayers[obj.player].marker)
      allPlayers[obj.player].marker.setPosition(movedLoc);
  } else if (obj.e === "damage") {
    for (var i = 0; i < obj.damage.length; ++i) {
      //console.log("reducing " + obj.damage[i].player + " hp from " + allPlayers[obj.damage[i].player].hp + " by " + obj.damage[i].dmg);
      allPlayers[obj.damage[i].player].hp -= obj.damage[i].dmg;
      if (allPlayers[obj.damage[i].player].hp <= 0 && obj.damage[i].dmg > 0) {
        allPlayers[obj.damage[i].player].hp = 0;
        allPlayers[obj.damage[i].player].marker.setMap(null);
        allPlayers[obj.damage[i].player].aliveSince = null;
        drawPlayer(obj.damage[i].player);
        if (obj.damage[i].player === uid && worldTopbar) {
          killed();
          Ext.Msg.alert("Dead!", allPlayers[uid].name + ", you have been killed!");
        }
      }
    }
  } else if (obj.e === "gxp") {
    allPlayers[obj.uid].gxp += obj.gxp;
  } else if (obj.e === "events") {
    var eventHtml = "<b>Recent events</b>";
    for (var k = 0; k < obj.events.length; k++) {
      var e = obj.events[k];
      var ts = new Date(parseInt(e._id.substring(0, 8), 16) * 1000);
      eventHtml += "<br><font color='grey'>" + ts.getMonth() + "/" + ts.getDate() + " " + ts.getHours() + ":" + (ts.getMinutes() < 10 ? '0' : '') + ts.getMinutes() + ":" + (ts.getSeconds() < 10 ? '0' : '') + ts.getSeconds() + "</font> ";
      if (e.e === "missile") {
        eventHtml += "Launched missile <img src='/images/missile.png'>";
      } else if (e.e === "kill") {
        eventHtml += "Killed " + allPlayers[e.data].name + " <img src='/images/stamina.png'>";
      } else if (e.e === "killed") {
        eventHtml += "Killed by " + allPlayers[e.data].name + " <img width='16' height='16' src='/images/dead.png'>";
      } else if (e.e === "damage") {
        eventHtml += "You hit";
        for (var j = 0; j < e.data.length; j++) {
          var d = e.data[j];
          eventHtml += " " + allPlayers[d.player].name + " (" + d.dmg + " <img src='/images/energy.png'>)";
        }
      } else if (e.e === "damaged") {
        eventHtml += "Hit by missile (-" + e.data + " <img src='/images/health.png'>)";
      } else if (e.e === "respawn") {
        eventHtml += "Respawned";
      }
    }
    eventPane.update(eventHtml);
  } else if (obj.e === "respawn") {
    if (uid === obj.player._id) {
      respawnButton.hide();
      attackButton.enable(true);
      worldTopbar.setTitle("");
    }
    if (allPlayers[uid].marker)
      allPlayers[uid].marker.setMap(null);
    allPlayers[uid] = obj.player;
    allPlayers[uid].readyMissiles = numReadyMissiles(allPlayers[uid].items.m.m);
    missileButton.setBadge(allPlayers[uid].readyMissiles);
    //if (allPlayers[uid].readyMissiles === 0)
    //  missileButton.disable(true);
    drawPlayer(uid, true);
  }
});

socket.on('connect', function() {
  if (yourLocation)
    socket.send({ e: "init", uid: uid, loc: yourLocation });
});
socket.on('disconnect', function() {
  reconnectBox = Ext.Msg.show({title: 'Disconnected', msg: "Attempting to automatically reconnect...", buttons: []});
  setTimeout(connectLoop, 2000);
});

populateMap = function() {
  for (var i in allPlayers) {
    drawPlayer(i);
  }

  navigator.geolocation.watchPosition(function(position) {
    if (yourLocation.lat === position.coords.latitude && yourLocation.lng === position.coords.longitude)
      return; // no actual change in location
    yourLocation = {lat: position.coords.latitude, lng: position.coords.longitude};
    if (allPlayers[uid].hp > 0) {
      allPlayers[uid].coords.lat = position.coords.latitude;
      allPlayers[uid].coords.lng = position.coords.longitude;
      socket.send({ e: "move", uid: uid, loc: allPlayers[uid].coords });
      allPlayers[uid].marker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    }
  });
};

Ext.setup({
  icon: '/images/icon.png',
  tabletStartupScreen: '/images/tablet_startup.png',
  phoneStartupScreen: '/images/phone_startup.jpeg',
  glossOnIcon: true,
  onReady: function() {
    var launchMissile = function(button, event) {
      socket.send({ e: "m", uid: uid, loc: { lat: target.getPosition().lat(), lng: target.getPosition().lng() }});
      allPlayers[uid].readyMissiles--;
      missileButton.setBadge(allPlayers[uid].readyMissiles);
      if (allPlayers[uid].readyMissiles === 0)
        missileButton.disable(true);
    };

    attackToggle = function(t, button, pressed) {
      if (button.text == "Attack" && pressed) {
        //Ext.Msg.alert(button.text, "Tap where you want to launch a missile or place a landmine");
        worldTopbar.setTitle("Tap target");
        for (var p in allPlayers) {
          if (allPlayers[p].marker)
            allPlayers[p].marker.setClickable(false);
        }

        targetListener = google.maps.event.addListener(worldMap.map, "click", function(event) {
          if (target) {
            target.setMap(null); // clear previous marker
          }
          if (!this.crosshairs)
            this.crosshairs = new google.maps.MarkerImage(
              "/images/crosshairs.png",
              new google.maps.Size(40, 40),
              new google.maps.Point(0, 0),
              new google.maps.Point(23, 23) // TODO(jeff): I don't know why this isn't 20, 20!!! (on different computers, this offsets differently)
            );
          target = new google.maps.Marker({
            position: event.latLng,
            map: worldMap.map,
            clickable: false,
            zIndex: 9999,
            icon: this.crosshairs
          });
          missileButton.show();
          var distance = haversineDistance({lat: target.getPosition().lat(), lng: target.getPosition().lng()}, allPlayers[uid].coords);
          var duration = (-MISSILE_VELOCITY + Math.sqrt(MISSILE_VELOCITY * MISSILE_VELOCITY + 2 * MISSILE_ACCELERATION * distance)) / MISSILE_ACCELERATION;
          worldTopbar.setTitle(Math.round(distance) + "m (" + Math.round(duration) + "s)");
          //landmineButton.show(); TODO
        });
      } else {
        missileButton.hide();
        worldTopbar.setTitle("");
        //landmineButton.hide(); TODO
        if (target) {
          target.setMap(null);
        }
        if (targetListener) {
          google.maps.event.removeListener(targetListener);
          targetListener = null;
        }
        for (var p in allPlayers) {
          if (allPlayers[p].marker)
            allPlayers[p].marker.setClickable(true);
        }
      }
    };

    missileButton = new Ext.Button({
      text: 'Missile',
      ui: 'action',
      hidden: true,
      handler: launchMissile
    });
    missileButton.setWidth(84);

    respawnButton = new Ext.Button({
      text: 'Respawn',
      hidden: true,
      handler: alive,
      ui: 'confirm'
    });
    /*landmineButton = new Ext.Button({
      text: 'Landmine',
      hidden: true,
      ui: 'action'
    }); TODO(jeff): remove comment when adding this */

    attackButton = new Ext.Button({
      text: 'Attack',
      ui: 'action'
    });

    actionButtons = new Ext.SegmentedButton({
      allowDepress: true,
      listeners: { toggle: attackToggle },
      items: [ attackButton ]
    });

    worldTopbar = new Ext.Toolbar({
      dock: 'top',
      items: [
        actionButtons,
        //}, {   TODO(jeff): remove when adding this
        //  text: 'Defense',
      {
        xtype: 'spacer'
      }, {
        xtype: 'spacer'
      },
      missileButton,
      respawnButton
      /*landmineButton TODO*/]
    });
    if (allPlayers && allPlayers[uid].hp <= 0) {
      killed();
    }

    var initialCenter;
    var mapHide = true;
    if (yourLocation) {
      mapHide = false;
      initialCenter = new google.maps.LatLng(yourLocation.lat, yourLocation.lng);
    } else {
      initialCenter = new google.maps.LatLng(47.6063889, -122.3308333); // Seattle
    }
    worldMap = new Ext.Map({
      mapOptions: {
        navigationControl: false,
        center: initialCenter,
        zoom: 13,
        hidden: mapHide,
        mapTypeId: "customMap",
        mapTypeControl: false,
        streetViewControl: false
      },
      listeners: {
        maprender: function(comp, map) {
          socket.connect(); // TODO(jeff): check for connection? see socket.io's tryTransportsOnConnectTimeout
          map.mapTypes.set("customMap", new google.maps.StyledMapType(MapStyles.tron, {name: "Custom Style"}));
        }
      }
    });

    var world = new Ext.Panel({
      iconCls: 'search',
      title: 'World',
      items: [
        worldMap
      ],
      dockedItems: [
        worldTopbar
      ]
    });

    var onTap = function(subList, subIdx, el, e, detailCard) {
      var ds = subList.getStore(), r  = ds.getAt(subIdx);
      alert(r.get('text'));
    };

    var missions = new Ext.NestedList({
      title: "Missions",
      iconCls: "favorites",
      displayField: "text",
      getItemTextTpl: function(node) {return "<img src='http://www1.eveinfo.com/img/icons/64_64/icon13_04.png'>{text}";},
      store: Menus.missionsStore,
      listeners: { leafitemtap: onTap }
    });
    var shop = new Ext.NestedList({
      title: "Shop",
      iconCls: "settings",
      displayField: "text",
      store: Menus.shopStore,
      listeners: { leafitemtap: onTap }
    });
    var team = new Ext.NestedList({
      title: "Team",
      iconCls: "team",
      displayField: "text",
      store: Menus.teamStore,
      listeners: { leafitemtap: onTap }
    });

    var usernameField = new Ext.form.Text({
      name: "username",
      label: "Name"
    });

    var statusPane = new Ext.Container();
    eventPane = new Ext.Container({
      html: "<b>Recent events</b>",
      style: {
        fontSize: '75%'
      }
    });

    var profile = new Ext.Panel({
      title: "Profile",
      iconCls: "user",
      listeners: {
        activate: function() {
          usernameField.setValue(allPlayers[uid].name);
          var myxp = calcXP(allPlayers[uid]);
          // TODO(jeff): calculating kills method is a hack
          var statusHtml = "<table><tr><td>" +
            "<img src='/images/health.png'> " +
              allPlayers[uid].hp + " / 100<br></td><td>" +
            "<img src='/images/missile.png'> " +
              allPlayers[uid].readyMissiles + " missiles ready<br></td></tr><tr><td>" +
            "<img src='/images/xp.png'> " +
              myxp + "xp <font size='-1'><b>" + getRank(myxp) + "</b></font><br></td><td>" +
            "<img src='/images/energy.png'> " +
              allPlayers[uid].items.m.d + " max damage<br></td></tr><tr><td>" +
            "<img src='/images/stamina.png'> " +
              allPlayers[uid].gxp / 100 + " kills<br></td><td>" +
            "<img src='/images/attack.png'> " +
              allPlayers[uid].items.m.r + " blast radius</td></tr></table>";
          statusPane.update(statusHtml);
          socket.send({e: "events", uid: uid});
        }
      },
      items: [{
        title: "Profile",
        xtype: "form",
        id: "profile",
        scroll: "vertical",
        items: [
          usernameField,
          {
            xtype: 'spacer',
            height: 10
          }, {
            xtype: 'button',
            text: 'Save',
            ui: 'confirm',
            width: 100,
            handler: function() {
              var newName = usernameField.getValue();
              if (newName) {
                allPlayers[uid].name = newName;
                socket.send({e: "name", uid: uid, name: newName});
                this.setText('Saved');
                this.disable(true);
              }
            }
          }, {
            xtype: 'spacer',
            height: 15
          },
          statusPane,
          { xtype: 'spacer', height: 14 },
          eventPane
        ]
      }]
    });

    new Ext.TabPanel({
      fullscreen: true,
      cardSwitchAnimation: false,
      tabBar: {
        dock: 'bottom',
        layout: {
          pack: 'center'
        }
      },
      items: [
        world,
        //missions, TODO remove comments when for real
        //shop,
        //team,
        profile
      ]
    });

    Ext.Msg.enterAnimation = false;
    Ext.Msg.exitAnimation = false;
  }
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(position) {
    if (worldMap)
      worldMap.show();
    yourLocation = {lat: position.coords.latitude, lng: position.coords.longitude};
    if (allPlayers && allPlayers[uid].hp > 0)
      allPlayers[uid].coords = yourLocation;
    // there is occasionally a weird display bug for this alert, crunching this all up into one
    //if (position.coords.accuracy > 500)
    //  Ext.Msg.alert("Geolocation Approximation", "You location is currently only accurate within " + Math.round(position.coords.accuracy) + " meters.", Ext.emptyFn);
    if (worldMap)
      worldMap.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    if (socket.connected)
      socket.send({ e: "init", uid: uid, loc: yourLocation });
  }); // TODO(jeff): catch on error, make sure we catch if they have geolocation off on the iPhone
} else {
  Ext.Msg.alert("No Geolocation", "Your browser does not support geolocation. Please try a different browser.");
}

tick = function() {
  for (var i = 0; i < allMissiles.length; ++i) {
    if (!allMissiles[i])
      continue;
    if (serverTimeDiff + (new Date()).getTime() > allMissiles[i].arrivalTime) { // an alternative approach is setTimeout when you launch the missile
      if (allMissiles[i].blastR) {
        if (allMissiles[i].blastR >= 400 && allMissiles[i].blastR % 2 === 0) // TODO(jeff): make this the constant / variable
          allMissiles[i].blastR--;
        else if (allMissiles[i].blastR % 2 === 0)
          allMissiles[i].blastR += BLAST_SPEED;
        else if (allMissiles[i].blastR < BLAST_SPEED) {
          allMissiles[i].c.setMap(null);
          allMissiles[i] = null;
          continue;
        } else {
          allMissiles[i].blastR -= BLAST_SPEED;
        }
        allMissiles[i].c.setRadius(allMissiles[i].blastR);
      } else {
        allMissiles[i].blastR = BLAST_SPEED;
        if (allMissiles[i].line) {
          allMissiles[i].line.setMap(null);
          allMissiles[i].line = null;
        }
        if (allMissiles[i].owner === uid) {
          allPlayers[uid].readyMissiles++; // TODO(jeff): possible bug - respawn while missile is in transit gives you an extra missile here
          missileButton.setBadge(allPlayers[uid].readyMissiles);
          missileButton.enable(true);
        }
        allMissiles[i].c = new google.maps.Circle({
          center: new google.maps.LatLng(allMissiles[i].arrivalCoords.lat, allMissiles[i].arrivalCoords.lng),
          fillColor: "#00FFFF",
          fillOpacity: 0.5,
          strokeColor: "#00FFFF",
          map: worldMap.map,
          clickable: false,
          radius: BLAST_SPEED
        });
      }
    } else {
      drawMissile(i);
    }
  }
};
