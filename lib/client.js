const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");

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

		this.irc.log = utils.loggers.logIrc;
		initIrc.call(this, this.irc);

		//setup steam client
		this.steam = new Steam.SteamClient();
		this.steam.user = new Steam.SteamUser(this.steam);
		this.steam.friends = new Steam.SteamFriends(this.steam);

		this.steam.log = utils.loggers.logSteam;
		initSteam.call(this, this.steam);
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



module.exports = IrcSteamRelay;
