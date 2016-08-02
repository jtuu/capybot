const colors = require("colors");

const utils = {};
const loggers = {};

const TAG_STEAM = "[Steam]".magenta;
const TAG_IRC = "[IRC]".magenta;
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
loggers.logSteam = function logSteam(msg, ...rest) {
	loggers.log(`${TAG_STEAM} ${msg}`, ...rest);
}
loggers.logIrc = function logIrc(msg, ...rest) {
	loggers.log(`${TAG_IRC} ${msg}`, ...rest);
}
utils.loggers = loggers;


module.exports = utils;
