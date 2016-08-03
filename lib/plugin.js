module.exports = class Plugin {
	constructor(
		name = "plugin",
		trigger = require("./utils").misc.noopRegex,
		payload = () => console.warn(`Unimplemented payload in plugin "${this.name}"`),
		channel = true,
		whisper = false
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
		this.channel = channel;
		this.whisper = whisper;
	}
}
