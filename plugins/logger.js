const Plugin = require("../lib/plugin.js");
const pg = require("pg");
var config = require("../config/logger-config.default.json");
const {
	noopFn
} = require("../lib/utils").misc;
const defaultReason = "";

try{
  let configFile = require("../config/logger-config.json");
  Object.assign(config, configFile);
}catch(err){
  console.warn("Could not load logger-config.json. Using default config.");
}

const pool = new pg.Pool(config);

const emsgtype = [
  "message",
  "join",
  "part",
  "quit",
  "kick",
  "nick",
  "mode",
  "action",
  "topic",
  "unknown"
];
const queryString = `insert into ${config.table} (username, message, channel, msgfrom, msgtype, by, address) values ($1, $2, $3, $4, $5, $6, $7)`;

function log(username, message, channel, msgfrom, msgtype, by = "", address = ""){
  pool.query(queryString, [username, message, channel, msgfrom, msgtype, by, address]);
}

var loggerOnMessage = function(nick, channel, msg, raw){
  log(nick, msg, channel, "irc", "message", "", raw.host);
}

var loggerOnJoin = function(channel, nick, raw) {
  log(nick, "", this.channel, "irc", "join", "", raw.host);
};

var loggerOnQuit = function(nick, reason = defaultReason, channels, raw) {
  log(nick, reason, this.channel, "irc", "quit", "", raw.host);
};

var loggerOnPart = function(channel, nick, reason = defaultReason, raw) {
  log(nick, reason, this.channel, "irc", "part", "", raw.host);
};

var loggerOnKick = function(channel, nick, by, reason = defaultReason, raw) {
  log(nick, reason, this.channel, "irc", "kick", by, raw.host);
}

var loggerOnNick = function(oldNick, newNick, channels, raw) {
  log(newNick, "", this.channel, "irc", "nick", oldNick, raw.host);
}

var loggerOnMode = function(prefix, chan, by, mode, arg = "", raw) {
  log(by, prefix + mode + arg, this.channel, "irc", "mode", "", raw.host);
}

var loggerOnAction = function(from, to, text, raw) {
  log(from, text, to, "irc", "action", "", raw.host);
}

var loggerOnTopic = function(chan, topic, nick, raw) {
  log(nick, topic, chan, "irc", "topic", "", raw.host);
}

function payload(src, msg, type){
  if(!logger.init){
    init.call(this);
  }
}

function init(){
  logger.init = true;

  this.irc.removeListener("message#", this.loggerOnMessage || noopFn);
  this.irc.removeListener("join" + this.channel, this.loggerOnJoin || noopFn);
	this.irc.removeListener("part" + this.channel, this.loggerOnPart || noopFn);
	this.irc.removeListener("quit", this.loggerOnQuit || noopFn);
	this.irc.removeListener("nick", this.loggerOnNick || noopFn);
	this.irc.removeListener("+mode", this.loggerOnModePlus || noopFn);
	this.irc.removeListener("-mode", this.loggerOnModeMinus || noopFn);
	this.irc.removeListener("action", this.loggerOnAction || noopFn);
	this.irc.removeListener("topic", this.loggerOnTopic || noopFn);
	this.irc.removeListener("kick" + this.channel, this.loggerOnKick || noopFn);

  this.loggerOnMessage = loggerOnMessage.bind(this);
	this.loggerOnJoin = loggerOnJoin.bind(this, this.channel);
	this.loggerOnPart = loggerOnPart.bind(this, this.channel);
	this.loggerOnQuit = loggerOnQuit.bind(this);
	this.loggerOnNick = loggerOnNick.bind(this);
	this.loggerOnModePlus = loggerOnMode.bind(this, "+");
	this.loggerOnModeMinus = loggerOnMode.bind(this, "-");
	this.loggerOnAction = loggerOnAction.bind(this);
	this.loggerOnTopic = loggerOnTopic.bind(this);
	this.loggerOnKick = loggerOnKick.bind(this, this.channel);

  this.irc.on("message#", this.loggerOnMessage);
	this.irc.on("join" + this.channel, this.loggerOnJoin);
	this.irc.on("part" + this.channel, this.loggerOnPart);
	this.irc.on("quit", this.loggerOnQuit);
	this.irc.on("nick", this.loggerOnNick);
	this.irc.on("+mode", this.loggerOnModePlus);
	this.irc.on("-mode", this.loggerOnModeMinus);
	this.irc.on("action", this.loggerOnAction);
	this.irc.on("topic", this.loggerOnTopic);
	this.irc.on("kick" + this.channel, this.loggerOnKick);
}

const desc = "Logs activity to a database.";

const logger = new Plugin("logger", "", payload, desc);
module.exports = logger;
