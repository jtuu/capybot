const Steam = require("steam");
const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");
const {logErr} = utils.loggers;
const {formatIrcUser} = utils.misc;

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
			autoRejoin: true,
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
		});

		this.shouldSendSteamDisconnectMessage = false;
		this.shouldSendIrcDisconnectMessage = false;
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

	//keep trying to connect until connected
	cycleSteamConnect(){
		setTimeout(() => {
			if(!this.steam.loggedOn){
				this.steam.log("attempting to reconnect");
				this.steam.connect();
				this.cycleSteamConnect();
			}
		}, this.steamReconnectTime);
	}

	//keep trying to log in until logged in
	cycleSteamLogin(){
		setTimeout(() => {
			if(!this.steam.loggedOn && this.steam._connection){
				this.steam.log("attempting to relogin");
				this.steam.user.logOn({
					account_name: this.username,
					password: this.password
				});
				this.cycleSteamLogin();
			}
		}, this.steamReconnectTime)
	}

	sayTo(to, msg) {
		let ircMsg = msg, steamMsg = msg;
		if(typeof msg === "object"){
			ircMsg = msg.irc;
			steamMsg = msg.steam;
		}
		if (to === "irc") {
			if (this.loggedIn.irc) {
				this.irc.say(this.channel, ircMsg);
			}
		} else if (to === "steam") {
			if (this.steam.loggedOn) {
				this.steam.friends.sendMessage(this.room_id, steamMsg);
			}
		}
	}

	sayToBoth(msg) {
		this.sayTo("irc", msg);
		this.sayTo("steam", msg);
	}

	//why did this need to be promisified ._.
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

	//get all info about users in our channel
	//verbose is slow
	getIrcUsers(verbose) {
		return new Promise(topres => {
			this.irc.send("names", this.channel);
			this.irc.once(`names${this.channel}`, nicks => {
				if(verbose){
					Promise.all(
						Object.keys(nicks).map(nick => new Promise(res => {
							this.irc[this.irc.expanded ? "wii" : "whois"](nick, res);
						}))
					).then(topres);
				}else{
					topres(Object.keys(nicks));
				}
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
	//connection was succesful
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
	client.on("join", (channel, nick, raw) => {
		if(nick === this.nick){
			this.sayTo("steam", `${formatIrcUser(raw)} has joined ${channel}`);
		}
	});
	client.on("part", (channel, nick, reason = "", raw) => {
		if(nick === this.nick){
			this.sayTo("steam", `${formatIrcUser(raw)} has left ${channel} [${reason}]`);
		}
	});
	client.on("quit", (channel, nick, reason = "", raw) => {
		if(nick === this.nick){
			this.sayTo("steam", `${formatIrcUser(raw)} has quit [${reason}]`);
		}
	});
}

function initSteam(client) {
	client.on("error", err => {
		if(this.shouldSendSteamDisconnectMessage){
			this.sayTo("irc", "Disconnected from Steam, attempting to reconnect...");
			this.shouldSendSteamDisconnectMessage = false;
		}
		client.log(`error ${err}`);
		this.loggedIn.steam = false;
		client.log("disconnected");
		//start the reconnect cycle since we disconnected
		this.cycleSteamConnect();
	});
	client.on("loggedOff", eresult => {
		this.sayTo("irc", "Forcefully logged out of Steam, attempting to relogin...");
		client.log("logged off", Object.keys(Steam.EResult)[eresult]);
		this.loggedIn.steam = false;
		//start the login cycle
		//(i don't think it will ever actually finish because
		//when steam servers go down you get logged off, then immediately disconnected)
		this.cycleSteamLogin();
	})
	client.on("debug", msg => {
		client.log("debug", msg);
	})
	client.on("connected", () => {
		this.shouldSendSteamDisconnectMessage = true;
		client.log("connected");
		client.user.logOn({
			account_name: this.username,
			password: this.password
		});
	});
	//response from a login attempt (self)
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
		//save server list to a file
		//having a set list of servers is nice because that way
		//only certain connections need to be allowed in a firewall
		fs.writeFile(serverFilePath, JSON.stringify(servers, null, "\t"), "utf8", function(err) {
			if (err) throw err;
			client.log("saved servers.json");
		});
	});
	//message in a room
	client.friends.on("chatMsg", (src, msg, type, chatter) => {
		client.log("chatMsg", src, msg, type, chatter);
		runPlugins.call(this, client.clientName, "channel", src, msg, type, chatter);
	});
	//private message
	//unsure if messages in temporary "private" groups
	//still count as a friendMsg
	client.friends.on("friendMsg", (src, msg, type, chatter) => {
		client.log("friendMsg", src, msg, type, chatter);
		runPlugins.call(this, client.clientName, "whisper", src, msg, type, chatter);
	});

	//result of joinChat
	client.friends.on("chatEnter", (room, result) => {
		if(result === Steam.EChatRoomEnterResponse.Success){
			this.sayTo("irc", `${this.nick} entered chat`);
		}else{
			this.sayTo("irc", `Failed to enter chat (${Object.keys(Steam.EChatRoomEnterResponse).find(key => Steam.EChatRoomEnterResponse[key] === result)})`);
		}
	});
}

//finds the plugins that should be run for this event
//attempts to test them to prevent crashing the main program
function runPlugins(clientName, event, src, msg, type, chatter) {
	let responses = []; //returned values from the plugins
	this.pluginLoader.pluginNames.filter(name => this.pluginLoader.plugins[name][event]) //find the right plugins
		.forEach(name => {
			let plugin = this.pluginLoader.plugins[name];
			//only use plugin if it hasn't failed
			if (plugin && !plugin.failed) {
				//check if the plugins trigger matches the message
				if (msg.match(plugin.trigger)) {
					src = chatter || src; //steam separates the senders id, if it exists
					this[clientName].log(`plugin "${plugin.name}" triggered`);
					//run plugin in a try block once
					if (!plugin.tested) {
						try {
							//run the payload
							let response = plugin.payload.call(this, src, msg, clientName);
							//store the return value if the plugin sends a message
							if(plugin.sendsMessage){
								responses.push({
									name: plugin.name,
									priority: plugin.priority,
									promise: response
								});
							}
							//it seems to have worked so from now on we trust it blindly
							plugin.tested = true;
							this.failed = false;
						} catch (err) {
							logErr(`Error in plugin "${plugin.name}"`, err);
							//there was an error in the plugin so we flag it as unusable
							plugin.tested = true;
							plugin.failed = true;
						}
					} else {
						//bit of WETness here but oh well
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

//chain together an array of promises
function chainPromises(promises, resultcb, errcb){
	return promises.concat(Promise.resolve()).reduce((chain, promise, index) => {
		return chain.then(result => {
			resultcb(result);
			return promise.catch(err => errcb(err, index));
		})
	})
}

//input Plugin.Response[]
//makes sure plugin messages are sent in the right order
function handlePluginResponses(responses){
	let sorted = responses.sort((a, b) => a.priority - b.priority);
	chainPromises(sorted.map(r => r.promise), result => {
		if(result.steam){
			this.sayTo("steam", result.message);
		}
		if(result.irc){
			this.sayTo("irc", result.message);
		}
	}, (err, index) => logErr(`error in plugin "${sorted[index].name}"`, err))
}

module.exports = IrcSteamRelay;
