const Plugin = require("../lib/plugin.js");
const pg = require("pg");
const moment = require("moment");

function payload(src, msg, type) {
	let searchName = msg.slice(6);

	return new Promise((resolve, reject) => {
		pool.query(seenQuery, ["%" + searchName + "%"], (err, result) => {
			if (err) return reject(new Plugin.Response(err));

			if (result && result.rows) {
				if (result.rows.length) {

          let {username, message, date, msgtype, msgfrom} = result.rows[0];

					resolve(new Plugin.Response(`Last time I saw ${username} was ${moment(date).fromNow()} on ${
            msgfrom === "steam"
            ? "Steam"
            : "IRC"
          }.`))
				} else {
          resolve(new Plugin.Response(`I haven't seen anyone called "${searchName}" around here.`))
				}
			} else {
				return reject(new Plugin.Response(result));
			}
		})
	})
}

const desc = "Returns the last time a user was seen.";
const seenPlugin = new Plugin("seen", /^!seen/, payload, desc, 5, true, false, true);

seenPlugin.loadConfig();
const pool = new pg.Pool(seenPlugin.config);

const seenQuery = `
  select username, message, date, msgfrom, msgtype
    from ${seenPlugin.config.table}
    where username ilike $1
    order by date
    limit 1
`;

module.exports = seenPlugin;
