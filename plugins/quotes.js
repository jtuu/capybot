const Plugin = require("../lib/plugin");
var pg = require("pg");
var config = require("../config/quotes-config.default.json");

try {
	let configFile = require("../config/quotes-config.json");
	Object.assign(config, configFile);
} catch (err) {
	console.warn("Could not load quotes-config.json. Using default config.");
}

var pool = new pg.Pool(config);

var randomQuoteQuery = `
with x as (
  select * from ${config.table}
    where message ~* $1
		and msgtype = 'message'
		and message !~ '(^|: )!\\w+'
)
select x.username, x.message from x
  offset
    floor(random() * (select count(*) from x))
  limit 1
`;

const ignoreBots = true;
const botNames = [/escbot/];

function payload(src, msg, type) {
	let searchString = msg.replace(/^!quote\s?/, "");

	return new Promise((resolve, reject) => {
		pool.connect((err, client, done) => {
			if (err) {
				return reject(new Plugin.Response("error fetching client from pool " + err));
			}

			client.query(randomQuoteQuery, [searchString], (err, result) => {
				done();

				if (err) {
					return reject(new Plugin.Response("error running quer " + err));
				}

				var username = "",
					message = "";

				if (result && result.rows && result.rows[0] && result.rows[0].message) {
					var {
						username,
						message
					} = result.rows[0];

					if (ignoreBots) {
						if (!botNames.some(bn => bn.test(username))) {
							message = username + ": " + message;
						}
					} else {
						message = username + ": " + message;
					}
				} else {
					message = "No quotes found";
				}

				resolve(new Plugin.Response(message));
			})
		})
	})

}

const desc = "Returns a random message from a database (Postgres). Can take in a regex pattern as an argument. The pattern is used to limit the search to only messages that contain that pattern.";

module.exports = new Plugin("quotes", /^!quote/, payload, desc, 5, true, false, true);
