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

function initEvents() {
  relay.init = true;

	this.irc.removeAllListeners(`join${this.channel}`);
  this.irc.removeAllListeners(`part${this.channel}`);
  this.irc.removeAllListeners("quit");

  this.steam.friends.removeAllListeners("chatStateChange");

  var relayOnJoin = nick => {
		this.sayTo("steam", `${nick} has joined ${this.channel}`)
	};

  var relayOnPart = (nick, reason = defaultReason) => {
		this.sayTo("steam", `${nick} has left ${this.channel} [${reason}]`)
	};

  var relayOnQuit = (nick, reason = defaultReason) => {
    this.sayTo("steam", `${nick} has quit [${reason}]`)
  };

	this.irc.on(`join${this.channel}`, relayOnJoin);
	this.irc.on(`part${this.channel}`, relayOnPart);
	this.irc.on("quit", relayOnQuit);

  var relayOnChatStateChange = (state, movingUser, room, actingUser) => {
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

	this.steam.friends.on("chatStateChange", relayOnChatStateChange);
}

var relay = new Plugin("relay", "", payload, 1, true, false, true);
module.exports = relay;
