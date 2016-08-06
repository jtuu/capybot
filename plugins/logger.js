const Plugin = require("../lib/plugin.js");
const pg = require("pg");
var config = require("../config/logger-config.default.json");

try{
  let configFile = require("../config/logger-config.json");
  Object.assign(config, configFile);
}catch(err){
  console.warn("Could not load logger-config.json. Using default config.");
}

const pool = new pg.Pool(config);

const queryString = `insert into ${config.table} (username, message, channel, type) values ($1, $2, $3, $4)`;

const ignore = [/^!quote/, /^!8ball$/, /^!rejoin/];

function log(user, msg, channel, type){
  pool.query(queryString, [user, msg, channel, type]);
}

function payload(src, msg, type){
  if(ignore.some(re => re.test(msg))){
    return;
  }
  if(type === "steam"){
    this.getSteamUser(src).then(user => {
      log(user.player_name, msg, this.channel, type);
    })
  }else{
    log(src, msg, this.channel, type);
  }
}

const desc = "Saves messages to a database (Postgres).";

module.exports = new Plugin("logger", "", payload, desc);
