const Plugin = require("../lib/plugin.js");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var client = require("../index.js");

const desc = "Relays messages from HTTP to the chat.";
const plugin = new Plugin("post", "None", () => {}, desc, 5, false, false, false);
plugin.loadConfig();

const {secret, supersecret} = plugin.config;

app.post("/capybot/api/stop", bodyParser.json(), (req, res) => {
	if(req.body.secret !== secret || req.body.supersecret !== supersecret){
		return res.status(401).send();
	}
	res.status(200).send();
	res.end();
	server.close();
})

app.post("/capybot/api/message", bodyParser.json(), (req, res) => {
	if(req.body.secret !== secret){
		return res.status(401).send();
	}
	if(!req.body.content){
		return res.status(400).send();
	}
	client.sayToBoth(req.body.content);
	res.status(200).send();
})

const port = plugin.config.port;

const server = app.listen(port, () => console.log(`listening on ${port}`));
server.on("error", console.error.bind());

module.exports = plugin;
