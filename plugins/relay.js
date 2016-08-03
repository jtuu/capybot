var Plugin = require("../lib/plugin.js");

function payload(src, msg, type){
  if(type === "irc"){
    this.sayTo("steam", src, msg);
  }else{
    this.sayTo("irc", src, msg);
  }
}

module.exports = new Plugin("relay", "", payload);
