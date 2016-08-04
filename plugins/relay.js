var Plugin = require("../lib/plugin.js");
var defaultReason = require("../lib/utils").misc.defaultReason;
var Steam = require("steam");

function payload(src, msg, type) {
	initEvents.call(this);
	if (type === "steam") {
		this.getSteamUser(src).then(user => {
			this.sayTo("irc", `${decorateNick(user.player_name)} ${msg}`);
		})
	} else if (type === "irc") {
		this.sayTo("steam", `${decorateNick(src)} ${msg}`);
	}
}

function decorateNick(nick) {
	return `<${nick}>`;
}

function initEvents() {
	this.irc.removeAllListeners(`join${this.channel}`);
  this.irc.removeAllListeners(`part${this.channel}`);
  this.irc.removeAllListeners("quit");

  this.steam.removeAllListeners("chatStateChange");

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
			}
		})
	};

	this.steam.friends.on("chatStateChange", relayOnChatStateChange);
}

var relay = new Plugin("relay", "", payload);
module.exports = relay;
