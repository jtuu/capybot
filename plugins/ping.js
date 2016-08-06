var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  return new Promise(resolve => {
    resolve(new Plugin.Response("pong"));
  })
}

const desc = "Responds with 'pong'.";

module.exports = new Plugin("ping", "!ping", payload, desc, 5, true, true, true);
