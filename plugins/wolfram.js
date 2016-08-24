const Plugin = require("../lib/plugin");
const http = require("http");
const jsdom = require("jsdom")

const {querify, newlineRegex} = require("../lib/utils").misc;
const baseUrl = "http://api.wolframalpha.com/v2/query";

function payload(src, msg, type) {
  msg = msg.slice(4);
  return new Promise((resolve, reject) => {
    if(!msg){
      return reject(new Plugin.Response("invalid message"));
    }
    const params = {
      appid: wa.config.appid,
      input: msg,
      format: "plaintext"
    };
    const req = jsdom.env(`${baseUrl}${querify(params)}`, (err, win) => {
      let resultEl = win.document.querySelector(`
        pod[title='Result'] > subpod > plaintext,
        pod[title='Name'] > subpod > plaintext,
        pod[title='Basic Information'] > subpod > plaintext
      `);
      if(resultEl){
        resolve(new Plugin.Response(resultEl.textContent.replace(newlineRegex, " ")))
      }else{
        resolve(new Plugin.Response("¯\\_(ツ)_/¯"));
      }
      win.close();
    })
  })
}

const desc = "Query Wolfram Alpha.";
const wa = new Plugin("wolfram", /^!wa/, payload, desc, 5, true, false, true);
wa.loadConfig();

module.exports = wa;
