const Plugin = require("../lib/plugin.js");

const diceRegex = /(\d+)d(\d+)([+-]\d+)?/;

const absMax = 100000000;

function payload(src, msg, type) {
	var [_, diceCount, faceCount, modifier] = msg.slice(6).match(diceRegex);

	diceCount = parseInt(diceCount);
	faceCount = parseInt(faceCount);

	return new Promise((resolve, reject) => {
		if (diceCount && faceCount) {
			if (Math.abs(diceCount) <= absMax) {
				if (Math.abs(faceCount) <= absMax) {
					let sum = 0;
					for (let i = 0; i < diceCount; i++) {
						sum += (Math.random() * faceCount | 0) + 1;
					}
					if (modifier && Math.abs(modifier) <= absMax) {
						sum += parseInt(modifier);
					}
					return resolve(new Plugin.Response(String(sum)));
				} else {
					return resolve(new Plugin.Response("Too many faces"));
				}
			} else {
				return resolve(new Plugin.Response("Too many dice"));
			}
		} else {
			return reject(new Plugin.Response("invalid query"));
		}
	})
}

const desc = "Roll dice.";

module.exports = new Plugin("dice", /^!dice\s\d+d\d/, payload, desc, 5, true, false, true);
