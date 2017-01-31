const Plugin = require("../lib/plugin.js");

function payload(src, msg, type) {
	const [_, thing] = msg.match(/^!remove (.+)/) || [];

	if (thing) {
		return new Promise(resolve => {
			resolve(new Plugin.Response(`Removing ${thing}...
██]]]]]]]] 25% complete...
█████]]]]] 50% complete...
█████████] 99% complete...
${thing} removed!`));
		});
	}
}

const desc = "Removed";

module.exports = new Plugin("remove", /^!remove/, payload, desc, 5, true, false, true);
