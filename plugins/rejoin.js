const Plugin = require("../lib/plugin");

function payload(src, msg, type){
  this.steam.friends.leaveChat(this.room_id);
  this.steam.friends.joinChat(this.room_id);
}

module.exports = new Plugin("rejoin", /^!rejoin/, payload, 9, true, true);
