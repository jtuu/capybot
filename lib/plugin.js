const Response = class Response{
	constructor(
		message,
		steam = true,
		irc = true
	){
		this.steam = steam;
		this.irc = irc;
		this.message = message;
	}
}

module.exports = class Plugin {
	constructor(
		name = "plugin",
		trigger = require("./utils").misc.noopRegex,
		payload = () => console.warn(`Unimplemented payload in plugin "${this.name}"`),
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
	}

	static get Response(){
		return Response;
	}

}
