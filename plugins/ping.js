var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  this.irc.say(this.channel, "pong");
  this.steam.friends.sendMessage(this.room_id, "pong");
}

module.exports = new Plugin("ping", "!ping", payload);
