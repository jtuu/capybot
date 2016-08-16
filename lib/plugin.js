const Response = class Response {
	constructor(
		message,
		steam = true,
		irc = true
	) {
		this.steam = steam;
		this.irc = irc;
		this.message = message;
	}
}

const configDir = __dirname + "/../config";

module.exports = class Plugin {
	constructor(
		name = "plugin",
		trigger = require("./utils").misc.noopRegex,
		payload = () => console.warn(`Unimplemented payload in plugin "${this.name}"`),
		description = "No description.",
		priority = 9,
		channel = true,
		whisper = false,
		sendsMessage = false
	) {
		try {
			this.type = trigger.constructor.name || typeof trigger;
		} catch (err) {
			throw new TypeError("Malformed trigger");
		}

		this.name = name;
		this.trigger = trigger;
		this.payload = payload;
		this.tested = false;
		this.failed = false;
		this.priority = priority;
		this.channel = channel;
		this.whisper = whisper;
		this.sendsMessage = sendsMessage;
		this.description = description;

		this.configPath = `${configDir}/${this.name}-config.json`;
		this.defaultConfigPath = `${configDir}/${this.name}-config.default.json`;
	}

	static get Response() {
		return Response;
	}

	loadConfig() {
		let defaultOk = false;
		let config = {};
		try {
			Object.assign(config, require(this.defaultConfigPath));
			defaultOk = true;
		} catch (err) {
			console.warn(`Could not load ${this.name}-config.default.json.`);
		}
		try {
			Object.assign(config, require(this.configPath));
			this.config = config;
		} catch (err) {
			console.warn(`Could not load ${this.name}-config.json.${defaultOk ? " Using default config." : ""}`);
		}
	}

}
