if (typeof Menus === "undefined") {
  Menus = {};
}

var actionRoot = {
  text: "Actions",
  items: [{
    text: "Attack",
    items: [{
      text: "Launch Missile",
      leaf: true
    },{
      text: "Place Mine",
      leaf: true
    },{
      text: "Kamikaze",
      leaf: true
    }]
  },{
    text: "Defend",
    items: [{
      text: "Take Cover",
      leaf: true
    },{
      text: "Hide",
      leaf: true
    }]
  },{
    text: "Missions",
    items: [{
      text: "This page will list all the missions including your current mission",
      leaf: true
    }]
  }]
};
Ext.regModel("ActionItem", {
  fields: [
    { name: "text", type: "string" }
  ]
});
Menus.actionStore = new Ext.data.TreeStore({
  model: "ActionItem",
  root: actionRoot,
  proxy: {
    type: "memory",
    reader: {
      type: "tree",
      root: "items"
    }
  }
});

var shopRoot = {
  text: "Shop",
  items: [{
    text: "First Aid",
    leaf: true
  },{
    text: "Bunker",
    leaf: true
  },{
    text: "Buy Missile",
    leaf: true
  },{
    text: "Upgrade Missile Blast Radius",
    leaf: true
  },{
    text: "Upgrade Missile Damage",
    leaf: true
  },{
    text: "Buy Mine",
    leaf: true
  },{
    text: "Upgrade Mine Blast Radius",
    leaf: true
  },{
    text: "Upgrade Mine Damage",
    leaf: true
  }]
};
Ext.regModel("ShopItem", {
  fields: [
    { name: "text", type: "string" }
  ]
});
Menus.shopStore = new Ext.data.TreeStore({
  model: "ShopItem",
  root: shopRoot,
  proxy: {
    type: "memory",
    reader: {
      type: "tree",
      root: "items"
    }
  }
});

var teamRoot = {
  text: "Team",
  items: [{
    text: "Recruit from Facebook Academy",
    leaf: true
  },{
    text: "Choose Captain",
    leaf: true
  },{
    text: "View Org Tree",
    leaf: true
  },{
    text: "Send Message",
    leaf: true
  }]
};
Ext.regModel("TeamItem", {
  fields: [
    { name: "text", type: "string" }
  ]
});
Menus.teamStore = new Ext.data.TreeStore({
  model: "TeamItem",
  root: teamRoot,
  proxy: {
    type: "memory",
    reader: {
      type: "tree",
      root: "items"
    }
  }
});
