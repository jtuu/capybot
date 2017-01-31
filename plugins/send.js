const Plugin = require("../lib/plugin.js");

function payload(src, msg, type) {
	const [_, to, thing] = msg.match(/^!send (\S+) (.+)/) || [];

	if (to && thing) {
		return new Promise(resolve => {
			resolve(new Plugin.Response(`Sending ${thing} to ${to}...`));
		});
	}
}

const desc = "Sent ;)";

module.exports = new Plugin("send", /^!send/, payload, desc, 5, true, false, true);
