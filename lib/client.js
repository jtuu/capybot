const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");
const logErr = utils.loggers.logErr;

require("./ircexpansion")(Irc);

try {
	Steam.servers = require("./server.json");
} catch (err) {}

const IrcSteamRelay = class IrcSteamRelay {
	constructor(config) {
		Object.assign(this, config);

		this.pluginLoader = new PluginLoader();

		this.loggedIn = {
			steam: false,
			irc: false
		};

		//setup irc client
		this.irc = new Irc.Client(this.server, this.nick, {
			floodProtection: true,
			millisecondsOfSilenceBeforePingSent: 30 * 1000,
			channels: [this.channel],
			autoConnect: false
		});
		this.irc.clientName = "irc";
		this.irc.log = utils.loggers.logIrc;

		//setup steam client
		this.steam = new Steam.SteamClient();
		this.steam.clientName = "steam";
		this.steam.user = new Steam.SteamUser(this.steam);
		this.steam.friends = new Steam.SteamFriends(this.steam);
		this.steam.log = utils.loggers.logSteam;

		this.pluginLoader.loadAll().then(() => {
			initIrc.call(this, this.irc);
			initSteam.call(this, this.steam);
		})
	}

	connect() {
		this.irc.connect();
		this.irc.log("connecting...");

		this.steam.connect();
		this.steam.log("connecting...");
	}

	disconnect() {
		this.irc.disconnect();
		this.steam.disconnect();
	}

	sayTo(to, msg) {
		if (to === "irc") {
			if (this.loggedIn.irc) {
				this.irc.say(this.channel, msg);
			}
		} else if (to === "steam") {
			if (this.loggedIn.steam) {
				this.steam.friends.sendMessage(this.room_id, msg);
			}
		}
	}

	sayToBoth(msg) {
		this.sayTo("irc", msg);
		this.sayTo("steam", msg);
	}

	getSteamUser(id) {
		return new Promise(res => {
			res(this.steam.friends.personaStates[id])
		})
	}

	getSteamUsers() {
		return Promise.all(
			Object.keys(this.steam.friends.chatRooms[this.room_id]).map(id => {
				return this.getSteamUser(id);
			})
		)
	}

	getIrcUsers() {
		return new Promise(topres => {
			this.irc.send("names", this.channel);
			this.irc.once(`names${this.channel}`, nicks => {
				Promise.all(
					Object.keys(nicks).map(nick => new Promise(res => {
						this.irc[this.irc.expanded ? "wii" : "whois"](nick, res);
					}))
				).then(topres);
			})
		})
	}

	get steamUserState(){
		return Object.keys(Steam.EPersonaState);
	}
}


//setup events
function initIrc(client) {
	client.on("error", msg => {
		client.log("error", msg);
	});
	client.on("registered", msg => {
		client.log("registered", msg.server);
		this.loggedIn.irc = true;
	});
	client.on("message", msg => {
		client.log("message", msg);
	});
	client.on(`message${this.channel}`, (src, msg) => {
		runPlugins.call(this, client.clientName, "channel", src, msg);
	})
	client.on("pm", (src, msg) => {
		runPlugins.call(this, client.clientName, "whisper", src, msg);
	})
}

function initSteam(client) {
	client.on("error", err => {
		client.log(`error ${err}`)
	})
	client.on("connected", () => {
		client.log("connected");
		client.user.logOn({
			account_name: this.username,
			password: this.password
		});
	});
	client.on("logOnResponse", () => {
		client.log("logged in");
		this.loggedIn.steam = true;
		client.friends.setPersonaState(Steam.EPersonaState.Online);
		client.friends.joinChat(this.room_id);
	});
	client.on("servers", servers => {
		fs.writeFile(`${__dirname}/servers.json`, JSON.stringify(servers, null, "\t"), "utf8", function(err) {
			if (err) throw err;
			client.log("saved servers.json");
		});
	});
	client.friends.on("chatMsg", (src, msg, type, chatter) => {
		client.log("chatMsg", src, msg, type, chatter);

		runPlugins.call(this, client.clientName, "channel", src, msg, type, chatter);
	});
	client.friends.on("friendMsg", (src, msg, type, chatter) => {
		client.log("friendMsg", src, msg, type, chatter);

		runPlugins.call(this, client.clientName, "whisper", src, msg, type, chatter);
	});
}

function runPlugins(clientName, event, src, msg, type, chatter) {
	Object.keys(this.pluginLoader.plugins).filter(name => this.pluginLoader.plugins[name][event])
		.forEach(name => {
			let plugin = this.pluginLoader.plugins[name];
			if (plugin && !plugin.failed) {
				if (msg.match(plugin.trigger)) {
					src = chatter || src;
					this[clientName].log(`plugin "${plugin.name}" triggered`);
					if (!plugin.tested) {
						try {
							plugin.payload.call(this, src, msg, clientName);
							plugin.tested = true;
							this.failed = false;
						} catch (err) {
							logErr(`Error in plugin "${pluginName}"`, err);
							plugin.tested = true;
							plugin.failed = true;
						}
					} else {
						plugin.payload.call(this, src, msg, clientName);
					}
				}
			}
		})
}


module.exports = IrcSteamRelay;
