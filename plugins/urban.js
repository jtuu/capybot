const Plugin = require("../lib/plugin");
const http = require("http");
const {newlineRegex} = require("../lib/utils").misc;

const baseUrl = "http://api.urbandictionary.com/v0/define?term=";

function payload(src, msg, type) {
  msg = msg.slice(4);
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${encodeURIComponent(msg)}`, (res) => {
      res.on("error", err => {
        req.abort();
        reject(new Plugin.Response(err))
      });

      var body = "";
      res.on("data", data => body += data);
      res.on("end", () => {
        const parsedBody = JSON.parse(body);

        if(
          parsedBody
          && parsedBody.list
          && parsedBody.list[0]
          && parsedBody.list[0].definition
        ){
          resolve(new Plugin.Response(parsedBody.list[0].definition.replace(newlineRegex, " ")));
        }else{
          resolve(new Plugin.Response("¯\\_(ツ)_/¯"));
        }
      });
    });
  })
}

const desc = "Search for a definition in Urban Dictionary.";

module.exports = new Plugin("urban", /^!ud/, payload, desc, 5, true, false, true);
