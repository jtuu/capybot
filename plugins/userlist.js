var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  if(type === "steam"){
    this.getIrcUsers().then(users => {
      users.forEach(user => {
        this.steam.friends.sendMessage(src, ircUserToString(user));
      })
    })
  }else if(type === "irc"){
    this.getSteamUsers().then(users => {
      users.forEach(user => {
        this.irc.say(src, steamUsertoString.call(this, user));
      })
    })
  }
}

function steamUsertoString(user){
  return `${user.player_name} [${this.steamUserState[user.persona_state]}]${user.game_name ? " in game " + user.game_name : ""} http://steamcommunity.com/profiles/${user.friendid}`;
}

function ircUserToString(user){
  let str = `
  ${user.nick} [${user.user}@${user.host}]
    realname : ${user.realname}
    channels : [${user.channels.join(" ")}]
    server   : ${user.server} [${user.serverinfo}]`;
  if(user.idle){
    str += "\n    idle     : " + new Date(user.idle * 1000).toISOString().substr(11, 8);
  }
  if(user.away){
    str += "\n    away     : " + user.away
  };
  return str;
}

const desc = "Makes the bot whisper you with a list of all the users that are on the other side of the chat.";

module.exports = new Plugin("userlist", /^!userlist/, payload, desc, 9, true, true);
