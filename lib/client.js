const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");
const logErr = utils.loggers.logErr;

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
		initIrc.call(this, this.irc);

		//setup steam client
		this.steam = new Steam.SteamClient();
		this.steam.clientName = "steam";
		this.steam.user = new Steam.SteamUser(this.steam);
		this.steam.friends = new Steam.SteamFriends(this.steam);

		this.steam.log = utils.loggers.logSteam;
		initSteam.call(this, this.steam);

		this.pluginLoader.loadAll().then(() => {
			initPlugins.call(this, this.steam.friends, "chatMsg", this.steam.clientName);
			initPlugins.call(this, this.irc, `message${this.channel}`, this.irc.clientName);
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

	sayTo(to, from, msg){
		if(to === "irc"){
			if(this.loggedIn.irc){
				from = this.steam.friends.personaStates[from];
				if(from){
					from = from.player_name;
				}
				this.irc.say(this.channel, `<${from}> ${msg}`);
			}
		}else if(to === "steam"){
			if(this.loggedIn.steam){
				this.steam.friends.sendMessage(this.room_id, `<${from}> ${msg}`);
			}
		}
	}
}


//setup events
function initIrc(client) {
	client.on("error", msg => {
		client.log("error", err);
	});
	client.on("registered", msg => {
		client.log("registered", msg.server);
		this.loggedIn.irc = true;
	});
	client.on("message", msg => {
		client.log("message", msg);
	});
}

function initSteam(client) {
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
	});
	client.friends.on("friendMsg", (src, msg, type, chatter) => {
		client.log("friendMsg", src, msg, type, chatter);
	});
}

function initPlugins(client, event, clientName){
	client.on(event, (src, msg, type, chatter) => {
		for(let pluginName in this.pluginLoader.plugins){
			let plugin = this.pluginLoader.plugins[pluginName];
			if(plugin){
				if(msg.match(plugin.trigger)){
					src = clientName === "steam" ? chatter : src;
					if(!plugin.tested){
						this[clientName].log(`plugin "${plugin.name}" triggered`);
						try{
							plugin.payload.call(this, src, msg, clientName);
							plugin.tested = true;
							this.failed = false;
						}catch(err){
							logErr(`Error in plugin "${pluginName}"`, err);
							plugin.tested = true;
							plugin.failed = true;
						}
					}else if(!plugin.failed){
						this[clientName].log(`${plugin.name} triggered`);
						plugin.payload.call(this, src, msg, clientName);
					}
				}
			}
		}
	})
}


module.exports = IrcSteamRelay;
