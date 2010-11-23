var tabpanel, target, targetListener, missileButton, landmineButton, worldMap, worldTopbar, initialLocation, allPlayers, allMissiles, populateMap;
var socket = new io.Socket(); 

socket.connect();
socket.on('message', function(obj) {
  allPlayers = obj.players;
  allMissiles = obj.missiles;
  if (worldMap)
    populateMap();
});

function calcXP(aliveSince) {
  // TODO(jeff): getting the date on client side is not a good idea
  return Math.floor(((new Date()).getTime() - aliveSince) / 60000); // 1 XP per minute
}

populateMap = function() {
  for (var i = 0; i < allPlayers.length; ++i) {
    var icon = "/images/soldier.png";
    var plocation = new google.maps.LatLng(allPlayers[i].coords.lat, allPlayers[i].coords.long);
    var pmarker = new google.maps.Marker({
      position: plocation,
      map: worldMap.map,
      title: allPlayers[i]._id,
      icon: icon
    });
    allPlayers[i].marker = pmarker;
    pmarker.info = allPlayers[i];
    google.maps.event.addListener(pmarker, 'click', function() {
      Ext.Msg.alert("Agent " + this.info._id, this.info.hp + "hp " + calcXP(this.info.aliveSince) + "xp");
    });
  }
}

Ext.setup({
  icon: '/images/icon.png',
  tabletStartupScreen: '/images/tablet_startup.png',
  phoneStartupScreen: '/images/phone_startup.jpeg',
  glossOnIcon: true,
  onReady: function() {

    var launchMissile = function(button, event) {
      var missileMsg = "You are about to launch a missile to a target that is TODO meters away. This will take TODO time, and you will have TODO missiles remaining if you continue. Continue launch?";
      Ext.Msg.confirm("Confirm Missile Launch", missileMsg, function(buttonId) {
        if (buttonId === "yes") {
          socket.send({ e: "m", loc: target.getPosition() });
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
              "/images/crosshairs.png", // TODO(jeff): crosshairs.png is not exactly a symetrical icon
              new google.maps.Size(41, 41),
              new google.maps.Point(0, 0),
              new google.maps.Point(21, 21)
            )
          });
          missileButton.show();
          landmineButton.show();
          //worldTopbar.doLayout();
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
        center: initialLocation,
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
    initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    //if (position.coords.accuracy > 500)
    //  Ext.Msg.alert("Geolocation Approximation", "You location is currently only accurate within " + Math.round(position.coords.accuracy) + " meters.", Ext.emptyFn);
    if (worldMap)
      worldMap.map.setCenter(initialLocation);
    socket.send({ e: "init", loc: initialLocation });
  }); // TODO(jeff): catch on error
} else {
  Ext.Msg.alert("No Geolocation", "Your browser does not support geolocation. Please try a different browser.", Ext.emptyFn);
}
