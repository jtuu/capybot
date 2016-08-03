var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  if(type === "steam"){
    this.getSteamUser(src).then(user => {
      this.sayTo("irc", `${decorateNick(user.player_name)} ${msg}`);
    })
  }else if(type === "irc"){
    this.sayTo("steam", `${decorateNick(src)} ${msg}`);
  }
}
function decorateNick(nick){
  return `<${nick}>`;
}

module.exports = new Plugin("relay", "", payload);
