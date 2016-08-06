const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");
const logErr = utils.loggers.logErr;

require("./ircexpansion")(Irc);

const serverFilePath = __dirname + "/../config/servers.json";

try {
	Steam.servers = require(serverFilePath);
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
			autoConnect: false,
			debug: true
		});
		this.irc.clientName = "irc";
		this.irc.log = utils.loggers.logIrc;

		//setup steam client
		this.steam = new Steam.SteamClient();
		this.steam.clientName = "steam";
		this.steam.user = new Steam.SteamUser(this.steam);
		this.steam.friends = new Steam.SteamFriends(this.steam);
		this.steam.log = utils.loggers.logSteam;

		this.steamReconnectTime = 30 * 1000;

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

	cycleSteamConnect(){
		setTimeout(() => {
			if(!this.steam.loggedOn){
				this.steam.log("attempting to reconnect");
				this.steam.connect();
				this.cycleSteamConnect();
			}
		}, this.steamReconnectTime);
	}

	cycleSteamLogin(){
		setTimeout(() => {
			if(!this.steam.loggedOn){
				this.steam.log("attempting to relogin");
				client.user.logOn({
					account_name: this.username,
					password: this.password
				});
				this.cycleSteamLogin();
			}
		}, this.steamReconnectTime)
	}

	sayTo(to, msg) {
		if (to === "irc") {
			if (this.loggedIn.irc) {
				this.irc.say(this.channel, msg);
			}
		} else if (to === "steam") {
			if (this.steam.loggedOn) {
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
	client.on("message", (src, dest, msg) => {
		client.log("message", src, dest, msg);
	});
	client.on(`message${this.channel}`, (src, msg) => {
		runPlugins.call(this, client.clientName, "channel", src, msg);
	});
	client.on("pm", (src, msg) => {
		runPlugins.call(this, client.clientName, "whisper", src, msg);
	});

}

function initSteam(client) {
	client.on("error", err => {
		client.log(`error ${err}`);
		this.loggedIn.steam = false;
		client.log("disconnected");

		this.cycleSteamConnect();
	});
	client.on("loggedOff", eresult => {
		client.log("logged off", Object.keys(Steam.EResult)[eresult]);
		this.loggedIn.steam = false;

		this.cycleSteamLogin();
	})
	client.on("debug", msg => {
		client.log("debug", msg);
	})
	client.on("connected", () => {
		client.log("connected");
		client.user.logOn({
			account_name: this.username,
			password: this.password
		});
	});
	client.on("logOnResponse", (response) => {
		if(response.eresult === Steam.EResult.OK){
			client.log("logged in");
			this.loggedIn.steam = true;
			client.friends.setPersonaState(Steam.EPersonaState.Online);
			client.friends.joinChat(this.room_id);
		}else{
			client.log("could not login", response);
		}
	});
	client.on("servers", servers => {
		fs.writeFile(serverFilePath, JSON.stringify(servers, null, "\t"), "utf8", function(err) {
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
	let responses = [];
	this.pluginLoader.pluginNames.filter(name => this.pluginLoader.plugins[name][event])
		.forEach(name => {
			let plugin = this.pluginLoader.plugins[name];
			if (plugin && !plugin.failed) {
				if (msg.match(plugin.trigger)) {
					src = chatter || src;
					this[clientName].log(`plugin "${plugin.name}" triggered`);
					if (!plugin.tested) {
						try {
							let response = plugin.payload.call(this, src, msg, clientName);
							if(plugin.sendsMessage){
								responses.push({
									priority: plugin.priority,
									promise: response
								});
							}
							plugin.tested = true;
							this.failed = false;
						} catch (err) {
							logErr(`Error in plugin "${plugin.name}": ${err}`);
							plugin.tested = true;
							plugin.failed = true;
						}
					} else {
						let response = plugin.payload.call(this, src, msg, clientName);
						if(plugin.sendsMessage){
							responses.push({
								priority: plugin.priority,
								promise: response
							});
						}
					}
				}
			}
		});

		handlePluginResponses.call(this, responses);
}

function chainPromises(promises, callback){
	return promises.concat(Promise.resolve()).reduce((chain, promise) => {
		return chain.then(result => {
			callback(result);
			return promise;
		})
	})
}

function handlePluginResponses(responses){
	chainPromises(responses.sort((a, b) => a.priority - b.priority).map(r => r.promise), result => {
		if(result.steam){
			this.sayTo("steam", result.message);
		}
		if(result.irc){
			this.sayTo("irc", result.message);
		}
	})
}

module.exports = IrcSteamRelay;
