const Irc = require("irc");
const fs = require("fs");
const utils = require("./utils");
const PluginLoader = require("./pluginloader");
const {logErr} = utils.loggers;
const {formatIrcUser} = utils.misc;

require("./ircexpansion")(Irc);

const Bot = class Bot {
	constructor(config) {
		Object.assign(this, config);

		this.pluginLoader = new PluginLoader();

		this.loggedIn = {
			irc: false
		};

		//setup irc client
		this.irc = new Irc.Client(this.server, this.nick, {
			floodProtection: true,
			millisecondsOfSilenceBeforePingSent: 30 * 1000,
			channels: [],
			autoConnect: false,
			autoRejoin: true,
			debug: true
		});
		this.irc.clientName = "irc";
		this.irc.log = utils.loggers.logIrc;

		this.pluginLoader.loadAll().then(() => {
			initIrc.call(this, this.irc);
		}).catch((err) => {
			console.error("Error when loading plugins", err)
		});

		this.shouldSendIrcDisconnectMessage = false;
	}

	connect() {
		this.irc.connect();
		this.irc.log("connecting...");
	}

	disconnect() {
		this.irc.disconnect();
	}


	sayTo(to, msg) {
		let ircMsg = msg;
		if(typeof msg === "object"){
			ircMsg = msg.irc;
		}
		if (to === "irc") {
			if (this.loggedIn.irc) {
				this.irc.say(this.channel, ircMsg);
			}
		}
	}

	sayToBoth(msg) {
		this.sayTo("irc", msg);
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
}

function initBitlbee(client){
	client.say("&bitlbee", `identify ${this.password}`)
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
		initBitlbee.call(this, client);
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

	});
	client.on("part", (channel, nick, reason = "", raw) => {

	});
	client.on("quit", (channel, nick, reason = "", raw) => {

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
		if(result.irc){
			this.sayTo("irc", result.message);
		}
	}, (err, index) => logErr(`error in plugin "${sorted[index].name}"`, err))
}

module.exports = Bot;
