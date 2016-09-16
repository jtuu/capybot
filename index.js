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

function shutdown(){
	client.sayToBoth("Going down for maintenance");
	setTimeout(() => {
		client.disconnect();
		setTimeout(process.exit, 1000);
	}, 1000);
}

//instantiate client
const Client = require("./lib/client");
const client = new Client(config);
client.connect();

module.exports = client;


//graceful exit
process.on("uncaughException", err => {
	client.sayToBoth("Crashing... (uncaughException)");
	console.log(e);
	setTimeout(() => process.exit(99), 2000);
});

process.on("SIGINT", () => {
	client.sayToBoth("Exiting... (SIGINT)");
	setTimeout(() => process.exit(2), 2000);
});

process.on("SIGTERM", () => {
	client.sayToBoth("Exiting... (SIGTERM)");
	setTimeout(() => process.exit(2), 2000);
});

process.on("SIGHUP", () => {
	client.sayToBoth("Exiting... (SIGHUP)");
	setTimeout(() => process.exit(2), 2000);
});
