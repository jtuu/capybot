const Plugin = require("../lib/plugin");
const Cleverbot = require("cleverbot.io");

var session = Promise.reject();

function payload(src, msg, type) {
  msg = msg.slice(4);
  return new Promise((resolve, reject) => {
    if(!msg){
      return reject(new Plugin.Response("no message"));
    }
    session.then(() => {
      bot.ask(msg, (err, response) => {
        if(err)return reject(new Plugin.Response(err));

        return resolve(new Plugin.Response(response));
      })
    }).catch(err => {
      reject(new Plugin.Response(err));
    })
  })
}

const desc = "Chat with Cleverbot.";
const cbPlugin = new Plugin("cleverbot", /^!cb/, payload, desc, 5, true, false, true);

cbPlugin.loadConfig();
const bot = new Cleverbot(cbPlugin.config.user, cbPlugin.config.key);
bot.setNick(cbPlugin.config.session);

session = new Promise((res, rej) => {
  bot.create((err, sess) => {
    if(err)return rej(err);
    res(sess);
  })
})

module.exports = cbPlugin;
