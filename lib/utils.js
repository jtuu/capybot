const colors = require("colors");
const zlib = require("zlib");

const utils = {};
const loggers = {};
const misc = {};
misc.noopRegex = /$./;
misc.newlineRegex = /(?:\r?\n|\r)+/gm;
misc.whitespaceRegex = /\s+/g;
misc.defaultReason = "None";
misc.noopFn = () => {};
misc.unzip = function(data) {
	return new Promise((res, rej) => {
		if (!data.length) {
			return res(new Buffer(0));
		}
		zlib.unzip(data, (err, zdata) => {
			if (err) return rej(err);
			return res(zdata);
		})
	})
}
misc.querify = function(o) {
	return "?" + Object.keys(o).reduce((stack, key) => {
		return stack += `${key}=${encodeURIComponent(o[key])}&`;
	}, "")
}
misc.formatIrcUser = function(raw) {
	return `${raw.nick} [${raw.user}@${raw.host}]`;
}

loggers.log = function log(msg, ...rest) {
	rest = rest.filter(v => v);
	let len = rest.length;
	console.log(
		`[${(new Date()).toJSON().grey}] ${msg.white.bold} ${JSON.stringify(
      rest, (len === 1 && typeof rest[0] === "object" ? Reflect.ownKeys(rest[0]) : null),
      (
        len > 1 || (rest.some(o => typeof o !== "string" && (o.length > 1 || Object.keys(o).length > 1))) //wtf is this
        ? 2
        : null
      )
    )}`
	);
}

function createTaggedLogger(tag) {
	return function(msg, ...rest) {
		loggers.log(`${tag} ${msg}`, ...rest);
	}
}

const TAG_STEAM = "[Steam]".magenta;
const TAG_IRC = "[IRC]".magenta;
const TAG_PLUGIN = "[Plugin]".magenta;
const TAG_ERROR = "[Error]".red;

loggers.logSteam = createTaggedLogger(TAG_STEAM);
loggers.logIrc = createTaggedLogger(TAG_IRC);
loggers.logPlugin = createTaggedLogger(TAG_PLUGIN);
loggers.logErr = createTaggedLogger(TAG_ERROR);


utils.loggers = loggers;
utils.misc = misc;
module.exports = utils;
