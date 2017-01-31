var Plugin = require("../lib/plugin.js");
var config = require("../config/autoop-config.default.json");

try {
	let configFile = require("../config/autoop-config.json");
	Object.assign(config, configFile);
} catch (err) {
	console.warn("Could not load autoop-config.json. Using default config.");
}

function payload(src, msg, type) {
	if(!autoop.init){
    init.call(this);
  }
}

function onRawJoin(raw){
  if(raw.command === "JOIN"){
    let match = config.masks.some(mask => {
      return mask.test(raw.prefix);
    });

    if(match){
      setTimeout(() => {
        this.irc.send("MODE", this.channel, "+o", raw.nick);
      }, 2000);
    }
  }
}

function init(){
  autoop.init = true;

  config.masks = config.masks.map(mask => {
    return new RegExp(mask);
  })

  this.irc.removeListener("raw", this.onRawJoin || (() => {}));

  this.onRawJoin = onRawJoin.bind(this);

  this.irc.on("raw", this.onRawJoin);
}

const desc = "Sets +o for specified users when they join.";

var autoop = new Plugin("autoop", "", payload, desc);
module.exports = autoop;
