const config = require("./config/client-config.default.json");

//merge config file with defaults if exists
try {
	let configFile = require("./config/client-config.json");
	Object.assign(config, configFile);
} catch (err) {
	console.warn("Could not load client-config.json. Using default config.");
}

//a rudimentary REPL for debugging purposes
function setupRepl() {
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", data => {
		try {
			console.log(eval(data));
		} catch (err) {
			console.error(err);
		}
	});
}
setupRepl();

//instantiate client
const Client = require("./lib/client");
const client = new Client(config);
client.connect();
