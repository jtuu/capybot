const colors = require("colors");

const utils = {};
const loggers = {};
const misc = {};
misc.noopRegex = /\z./;
misc.defaultReason = "None";

loggers.log = function log(msg, ...rest) {
	rest = rest.filter(v => v);
	console.log(
		`[${(new Date()).toJSON().grey}] ${msg.white.bold} ${JSON.stringify(
      rest, null,
      (
        rest.length > 1 || (rest.some(o => typeof o !== "string" && (o.length > 1 || Object.keys(o).length > 1))) //wtf is this
        ? 2
        : null
      )
    )}`
	);
}
function createTaggedLogger(tag){
	return function(msg, ...rest){
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
