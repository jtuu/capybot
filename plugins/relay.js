const Plugin = require("../lib/plugin.js");
const {
	defaultReason,
	noopFn,
	newlineRegex,
	formatIrcUser
} = require("../lib/utils").misc;
const Steam = require("steam");

const colors = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13];
const colorChar = "\x03";
const endChar = "\x0f";

function payload(src, msg, type) {
	if (!relay.init) {
		initEvents.call(this);
	}

	return new Promise(resolve => {
		if (type === "steam") {
			this.getSteamUser(src).then(user => {
				let nick = decorateNick(user.player_name, true);
				resolve(new Plugin.Response(`${nick} ${msg.replace(newlineRegex, `\n${nick} `)}`, false, true))
			})
		} else {
			resolve(new Plugin.Response(`${decorateNick(src, false)} ${msg}`, true, false))
		}
	})
}

function decorateNick(nick, color) {
	if (color) {
		nick = colorNick(nick);
	}
	return `<${nick}>`;
}

function colorNick(nick) {
	let color = colors[nick.split("").reduce((p, c) => String(p.charCodeAt(0) + c.charCodeAt(0)), "\x00") % colors.length];
	return colorChar + color + nick + endChar;
}

var relayOnJoin = function(channel, nick, raw) {
	this.sayTo("steam", `${formatIrcUser(raw)} has joined ${channel}`)
};

var relayOnQuit = function(nick, reason = defaultReason, channels, raw) {
	this.sayTo("steam", `${formatIrcUser(raw)} has quit [${reason}]`)
};

var relayOnPart = function(channel, nick, reason = defaultReason, raw) {
	this.sayTo("steam", `${formatIrcUser(raw)} has left ${channel} [${reason}]`)
};

var relayOnKick = function(channel, nick, by, reason = defaultReason, raw) {
	this.sayTo("steam", `${nick} was kicked from ${channel} by ${by} [${reason}]`)
}

var relayOnNick = function(oldNick, newNick, channels, raw) {
	this.sayTo("steam", `${oldNick} is now known as ${newNick}`)
}

var relayOnMode = function(prefix, chan, by, mode, arg, raw) {
	this.sayTo("steam", `mode/${chan} [${prefix}${mode}${arg ? " " + arg : ""}] by ${by}`)
}

var relayOnAction = function(from, to, text, raw) {
	this.sayTo("steam", `* ${from} ${text}`);
}

var relayOnTopic = function(chan, topic, nick, raw) {
	this.sayTo("steam", `${nick} changed the topic of ${chan} to: ${topic}`)
}

var relayOnKill = function(nick, reason = defaultReason, channels, raw){
	this.sayTo("steam", `${nick} was killed [${reason}]`)
}

var relayOnChatStateChange = function(state, movingUser, room, actingUser) {
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
				console.log("Unexpected chatStateChange: " + state)
		}
	})
};

function initEvents() {
	relay.init = true;

	this.irc.removeListener("join" + this.channel, this.relayOnJoin || noopFn);
	this.irc.removeListener("part" + this.channel, this.relayOnPart || noopFn);
	this.irc.removeListener("quit", this.relayOnQuit || noopFn);
	this.irc.removeListener("nick", this.relayOnNick || noopFn);
	this.irc.removeListener("+mode", this.relayOnModePlus || noopFn);
	this.irc.removeListener("-mode", this.relayOnModeMinus || noopFn);
	this.irc.removeListener("action", this.relayOnAction || noopFn);
	this.irc.removeListener("topic", this.relayOnTopic || noopFn);
	this.irc.removeListener("kick" + this.channel, this.relayOnKick || noopFn);
	this.irc.removeListener("kill", this.relayOnKill || noopFn);
	this.steam.friends.removeListener("chatStateChange", this.relayOnChatStateChange || noopFn);

	this.relayOnJoin = relayOnJoin.bind(this, this.channel);
	this.relayOnPart = relayOnPart.bind(this, this.channel);
	this.relayOnQuit = relayOnQuit.bind(this);
	this.relayOnNick = relayOnNick.bind(this);
	this.relayOnModePlus = relayOnMode.bind(this, "+");
	this.relayOnModeMinus = relayOnMode.bind(this, "-");
	this.relayOnAction = relayOnAction.bind(this);
	this.relayOnTopic = relayOnTopic.bind(this);
	this.relayOnKick = relayOnKick.bind(this, this.channel);
	this.relayOnKill = relayOnKill.bind(this);
	this.relayOnChatStateChange = relayOnChatStateChange.bind(this);

	this.irc.on("join" + this.channel, this.relayOnJoin);
	this.irc.on("part" + this.channel, this.relayOnPart);
	this.irc.on("quit", this.relayOnQuit);
	this.irc.on("nick", this.relayOnNick);
	this.irc.on("+mode", this.relayOnModePlus);
	this.irc.on("-mode", this.relayOnModeMinus);
	this.irc.on("action", this.relayOnAction);
	this.irc.on("topic", this.relayOnTopic);
	this.irc.on("kick" + this.channel, this.relayOnKick);
	this.irc.on("kill", this.relayOnKill);
	this.steam.friends.on("chatStateChange", this.relayOnChatStateChange);
}

const desc = "Relays messages and actions (joins, parts, quits, kicks, bans etc.) between IRC and Steam.";

var relay = new Plugin("relay", "", payload, desc, 1, true, false, true);
module.exports = relay;
