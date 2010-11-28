var tabpanel, target, targetListener, missileButton, landmineButton, worldMap, worldTopbar, allPlayers, allMissiles, populateMap, serverTimeDiff, tick;
var you = [];
var socket = new io.Socket(); 

socket.connect(); // TODO(jeff): check for connection? see socket.io's tryTransportsOnConnectTimeout
socket.on('message', function(obj) {
  if (obj.e === "sync") {
    serverTimeDiff = obj.time - (new Date()).getTime();
    allPlayers = obj.players;
    allMissiles = obj.missiles;
    you.index = obj.youIndex;
    var inactiveMissiles = 0;
    for (var i = 0; i < allPlayers[you.index].items.m.m.length; ++i) {
      if (allPlayers[you.index].items.m.m[i] === null) {
        inactiveMissiles++;
      }
    }
    you.inactiveMissiles = inactiveMissiles;
    if (inactiveMissiles === 0)
      missileButton.disable(true);
    if (worldMap)
      populateMap();
    setInterval(tick, 900);
  } else if (obj.e === "player") {
    var len = allPlayers.push(obj.player);
    drawPlayer(len-1);
  } else if (obj.e === "missile") {
    var len = allMissiles.push(obj.missile);
    drawMissile(len-1);
  } else if (obj.e === "moved") {
    for (var i = 0; i < allPlayers.length; ++i) { // TODO: should allPlayers be a dict instead of an array so our lookups are faster?
      if (allPlayers[i]._id === obj.player) {
        var movedLoc = new google.maps.LatLng(obj.loc.lat, obj.loc.lng)
        allPlayers[i].coords = movedLoc;
        allPlayers[i].marker.setPosition(movedLoc);
        break;
      }
    }
  }
});
socket.on('disconnect', function() {
  setTimeout(connectLoop, 1000);
});

function connectLoop() {
  if (socket.connected) {
    socket.send({ e: "init", loc: { lat: you.location.lat(), lng: you.location.lng() }}); '' //TODO(jeff): temporary hack. should just reconnect to previous session
  } else {
    setTimeout(connectLoop, 10000);
    socket.connect();
    Ext.Msg.alert('Disconnected', "Attempting to reconnect...", Ext.emptyFn);
  }
}

function calcXP(aliveSince) {
  // TODO(jeff): getting the date on client side is not a good idea
  return Math.floor((serverTimeDiff + (new Date()).getTime() - aliveSince) / 60000); // 1 XP per minute
}

function drawPlayer(i) {
  var plocation = new google.maps.LatLng(allPlayers[i].coords.lat, allPlayers[i].coords.long);
  var pmarker = new google.maps.Marker({
    position: plocation,
    map: worldMap.map,
    title: allPlayers[i]._id,
    icon: new google.maps.MarkerImage(
      "/images/soldier.png", 
      new google.maps.Size(24, 24),
      new google.maps.Point(0, 0),
      new google.maps.Point(12, 12)
    )
  });
  allPlayers[i].marker = pmarker;
  pmarker.info = allPlayers[i];
  google.maps.event.addListener(pmarker, 'click', function() {
    Ext.Msg.alert("Agent " + this.info._id, this.info.hp + "hp " + calcXP(this.info.aliveSince) + "xp");
  });
}

function drawMissile(i) {
  if (allMissiles[i] === null)
    return;
  var missileProgress = ((serverTimeDiff + (new Date()).getTime() - allMissiles[i].departureTime) / (allMissiles[i].arrivalTime - allMissiles[i].departureTime));
  if (missileProgress > 1 || missileProgress < 0)
    return;
  var missileLine = [new google.maps.LatLng(allMissiles[i].departureCoords.lat,
                                            allMissiles[i].departureCoords.long),
                     new google.maps.LatLng(allMissiles[i].departureCoords.lat + (allMissiles[i].arrivalCoords.lat - allMissiles[i].departureCoords.lat) * missileProgress,
                                            allMissiles[i].departureCoords.long + (allMissiles[i].arrivalCoords.long - allMissiles[i].departureCoords.long) * missileProgress)];
  if (allMissiles[i].line) {
    allMissiles[i].line.setPath(missileLine); // TODO(jeff): the line is drawn off from the crosshair's center. is it because of the earth's spherical shape?
  } else {
    var missilePath = new google.maps.Polyline({
      //path: [new google.maps.LatLng(allMissiles[i].departureCoords.lat, allMissiles[i].departureCoords.long),
      //       new google.maps.LatLng(allMissiles[i].arrivalCoords.lat, allMissiles[i].arrivalCoords.long)],
      path: missileLine,
      strokeColor: "#00FFFF",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    missilePath.setMap(worldMap.map);
    allMissiles[i].line = missilePath;
  }
}

populateMap = function() {
  for (var i = 0; i < allPlayers.length; ++i) {
    drawPlayer(i);
  }
  for (var i = 0; i < allMissiles.length; ++i) {
    drawMissile(i);
  }

  navigator.geolocation.watchPosition(function(position) {
    if (you.location.lat() === position.coords.latitude && you.location.lng() === position.coords.longitude)
      return; // no actual change in location
    you.location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    socket.send({ e: "move", loc: {lat: you.location.lat(), lng: you.location.lng() }});
    allPlayers[you.index].coords.lat = position.coords.latitude;
    allPlayers[you.index].coords.long = position.coords.longitude;
    allPlayers[you.index].marker.setPosition(you.location);
  });
}

Ext.setup({
  icon: '/images/icon.png',
  tabletStartupScreen: '/images/tablet_startup.png',
  phoneStartupScreen: '/images/phone_startup.jpeg',
  glossOnIcon: true,
  onReady: function() {

    var launchMissile = function(button, event) {
      var missileMsg = "This target is TODO meters (TODO time) away. You will have " + you.inactiveMissiles + " inactive missiles remaining. Continue?";
      Ext.Msg.confirm("Confirm Missile Launch", missileMsg, function(buttonId) {
        if (buttonId === "yes") {
          socket.send({ e: "m", loc: { lat: target.getPosition().lat(), lng: target.getPosition().lng() }});
          you.inactiveMissiles--;
          if (you.inactiveMissiles === 0)
            missileButton.disable(true);
          // I considered resetting the worldTopbar but maybe users will want to launch multiple missiles at once
        }
      });
    };

    var attackToggle = function(t, button, pressed) {
      if (button.text == "Attack" && pressed) {
        Ext.Msg.alert(button.text, "Tap where you want to launch a missile or place a landmine", Ext.emptyFn);

        targetListener = google.maps.event.addListener(worldMap.map, "click", function(event) {
          if (target) {
            target.setMap(null); // clear previous marker
          }
          target = new google.maps.Marker({
            position: event.latLng,
            map: worldMap.map,
            title: "Target",
            icon: new google.maps.MarkerImage(
              "/images/crosshairs.png",
              new google.maps.Size(40, 40),
              new google.maps.Point(0, 0),
              new google.maps.Point(23, 23) // TODO(jeff): I don't know why this isn't 20, 20!!! (on different computers, this offsets differently)
            )
          });
          missileButton.show();
          landmineButton.show();
        });
      } else {
        missileButton.hide();
        landmineButton.hide();
        if (target) {
          target.setMap(null);
        }
        if (targetListener) {
          google.maps.event.removeListener(targetListener);
          targetListener = null;
        }
      }
    };

    missileButton = new Ext.Button({
      text: 'Missile',
      ui: 'action',
      hidden: true,
      handler: launchMissile
    });
    landmineButton = new Ext.Button({
      text: 'Landmine',
      hidden: true,
      ui: 'action'
    });

    worldTopbar = new Ext.Toolbar({
      dock: 'top',
      items: [{
        xtype: 'segmentedbutton',
        allowDepress: true,
        listeners: { toggle: attackToggle },
        items: [{
          text: 'Attack'
        }, {
          text: 'Defense',
        }]
      }, {
        xtype: 'spacer'
      },
      missileButton,
      landmineButton]
    });

    worldMap = new Ext.Map({
      mapOptions: {
        navigationControl: false,
        center: you.location,
        zoom: 13,
        mapTypeId: "customMap",
        mapTypeControl: false,
        streetViewControl: false
      },
      listeners: {
        maprender: function(comp, map) {
          map.mapTypes.set("customMap", new google.maps.StyledMapType(MapStyles.tron, {name: "Custom Style"}));
          if (allPlayers && allMissiles)
            populateMap();
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

    tabpanel = new Ext.TabPanel({
      fullscreen: true,
      tabBar: {
        dock: 'bottom',
        layout: {
          pack: 'center'
        }
      },
      items: [
        world,
        missions,
        shop,
        team,
        { iconCls: "user", title: "Profile" }
      ]
    });
  }
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(position) {
    you.location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    // there is occasionally a weird display bug for this alert
    //if (position.coords.accuracy > 500)
    //  Ext.Msg.alert("Geolocation Approximation", "You location is currently only accurate within " + Math.round(position.coords.accuracy) + " meters.", Ext.emptyFn);
    if (worldMap)
      worldMap.map.setCenter(you.location);
    socket.send({ e: "init", loc: { lat: you.location.lat(), lng: you.location.lng() }});
  }); // TODO(jeff): catch on error, make sure we catch if they have geolocation off on the iPhone
} else {
  Ext.Msg.alert("No Geolocation", "Your browser does not support geolocation. Please try a different browser.", Ext.emptyFn);
}

tick = function() {
  for (var i = 0; i < allMissiles.length; ++i) {
    drawMissile(i);
    if (allMissiles[i] && serverTimeDiff + (new Date()).getTime() > allMissiles[i].arrivalTime) { // an alternative approach is setTimeout when you populate the world
      var c = new google.maps.Circle({
        center: new google.maps.LatLng(allMissiles[i].arrivalCoords.lat, allMissiles[i].arrivalCoords.long),
        fillColor: "#00FFFF",
        fillOpacity: 0.5,
        strokeColor: "#00FFFF",
        map: worldMap.map,
        radius: 0
      });
      var r = 0;
      var intvl = setInterval(function() {
        if (r >= 240) // TODO(jeff): make this radius actually the radius of damage
          r--;
        else if (r <= 5) {
          clearInterval(intvl);
          c.setMap(null);
          return;
        }
        else if (r % 2 === 0)
          r += 6;
        else
          r -= 6;
        c.setRadius(r);
      }, 500);
      allMissiles[i].line.setMap(null);
      allMissiles[i] = null;
      // TODO(jeff): need to sync to calc damages
    }
  }
}
