const Plugin = require("../lib/plugin");

function payload(src, msg, type){
  this.steam.friends.leaveChat(this.room_id);
  this.steam.friends.joinChat(this.room_id);
}

const desc = "Makes the bot leave and rejoin Steam chat.";

module.exports = new Plugin("rejoin", /^!rejoin/, payload, desc, 9, true, true);
