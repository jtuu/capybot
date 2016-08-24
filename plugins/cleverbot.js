const Plugin = require("../lib/plugin");
const Cleverbot = require("cleverbot-node");

const bot = new Cleverbot;
var session = new Promise(res => Cleverbot.prepare(res));

function payload(src, msg, type) {
  msg = msg.slice(4);
  return new Promise((resolve, reject) => {
    session.then(() => {
      bot.write(msg, response => {
        resolve(new Plugin.Response(response["message"]));
      })
    })
  })
}

const desc = "Chat with Cleverbot.";
const cbPlugin = new Plugin("cleverbot", /^!cb/, payload, desc, 5, true, false, true);

module.exports = cbPlugin;
