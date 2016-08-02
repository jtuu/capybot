const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const colors = require("colors");

try{
  Steam.servers = require("./server.json");
}catch(err){}

const IrcSteamRelay = class IrcSteamRelay {
	constructor(config) {
		Object.assign(this, config);

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

    this.irc.log = logIrc;
    initIrc.call(this, this.irc);

    //setup steam client
    this.steam = new Steam.SteamClient();
    this.steam.user = new Steam.SteamUser(this.steam);
    this.steam.friends = new Steam.SteamFriends(this.steam);

    this.steam.log = logSteam;
    initSteam.call(this, this.steam);
	}

	login() {
    this.irc.connect();
    logIrc("connecting...");

    this.steam.connect();
    logSteam("connecting...");
	}

  disconnect(){
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
function initSteam(client){
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
    fs.writeFile("servers.json", JSON.stringify(servers, null, "\t"), "utf8", function(err){
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


//loggers
const TAG_STEAM = "[Steam]".magenta;
const TAG_IRC = "[IRC]".magenta;

function logSteam(msg, ...rest) {
	log(`${TAG_STEAM} ${msg}`, ...rest);
}
function logIrc(msg, ...rest) {
	log(`${TAG_IRC} ${msg}`, ...rest);
}
function log(msg, ...rest) {
	console.log(`[${(new Date()).toJSON().grey}] ${msg.white.bold} ${JSON.stringify(rest, null, (rest.length > 1 ? 2 : null))}`);
}


module.exports = IrcSteamRelay;
