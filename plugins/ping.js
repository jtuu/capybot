var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  return new Promise(resolve => {
    resolve(new Plugin.Response("pong"));
  })
}

module.exports = new Plugin("ping", "!ping", payload, 5, true, true, true);
