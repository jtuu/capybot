var Plugin = require("../lib/plugin.js");

const message = `https://github.com/jtuu/capybot/blob/discord/doc/plugins.md`;

function payload(src, msg, type) {
	return new Promise(resolve => {
		resolve(new Plugin.Response(message));
	});
}

const desc = "Returns a link to this document.";

module.exports = new Plugin("help", /^!help/, payload, desc, 5, true, true, true);
