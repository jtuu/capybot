const Plugin = require("../lib/plugin.js");
const {defaultReason} = require("../lib/utils").misc;
const Steam = require("steam");

function payload(src, msg, type) {
  if(!relay.init){
    initEvents.call(this);
  }

  return new Promise(resolve => {
    if(type === "steam"){
      this.getSteamUser(src).then(user => {
        resolve(new Plugin.Response(`${decorateNick(user.player_name)} ${msg}`, false, true))
      })
    }else{
      resolve(new Plugin.Response(`${decorateNick(src)} ${msg}`, true, false))
    }
  })
}

function decorateNick(nick) {
	return `<${nick}>`;
}

var relayOnJoin = function(nick){
  this.sayTo("steam", `${nick} has joined ${this.channel}`)
};

var relayOnQuit = function(nick, reason = defaultReason){
  this.sayTo("steam", `${nick} has quit [${reason}]`)
};

var relayOnPart = function(nick, reason = defaultReason){
  this.sayTo("steam", `${nick} has left ${this.channel} [${reason}]`)
};

var relayOnChatStateChange = function(state, movingUser, room, actingUser){
  this.getSteamUser(movingUser).then(user => {
    let name = user.player_name;

    switch (state) {
      case Steam.EChatMemberStateChange.Entered:
        this.irc.say(this.channel, name + " entered chat");
        break;
      case Steam.EChatMemberStateChange.Left:
        this.irc.say(this.channel, name + " left chat");
        break;
      case Steam.EChatMemberStateChange.Disconnected:
        this.irc.say(this.channel, name + " disconnected");
        break;
      case Steam.EChatMemberStateChange.Kicked:
        this.getSteamUser(actingUser).then(user => {
          this.irc.say(this.channel, name + " was kicked by " + user.player_name)
        })
        break;
      case Steam.EChatMemberStateChange.Banned:
        this.getSteamUser(actingUser).then(user => {
          this.irc.say(this.channel, name + " was banned by " + user.player_name)
        })
        break;
      default:
        console.log("Unexpected chatStateChange: "+state)
    }
  })
};

var noop = () => {};

function initEvents() {
  relay.init = true;

  this.irc.removeListener("join", this.relayOnJoin || noop);
  this.irc.removeListener("part", this.relayOnPart || noop);
  this.irc.removeListener("quit", this.relayOnQuit || noop);
  this.steam.friends.removeListener("chatStateChange", this.relayOnChatStateChange || noop);

  this.relayOnJoin = relayOnJoin.bind(this);
  this.relayOnPart = relayOnPart.bind(this);
  this.relayOnQuit = relayOnQuit.bind(this);
  this.relayOnChatStateChange = relayOnChatStateChange.bind(this);

  this.irc.on("join", this.relayOnJoin);
  this.irc.on("part", this.relayOnPart);
  this.irc.on("quit", this.relayOnQuit);
  this.steam.friends.on("chatStateChange", this.relayOnChatStateChange);
}

const desc = "Relays messages and actions (joins, parts, quits, kicks, bans) between IRC and Steam.";

var relay = new Plugin("relay", "", payload, desc, 1, true, false, true);
module.exports = relay;
