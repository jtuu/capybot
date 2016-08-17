const Plugin = require("../lib/plugin.js");
const https = require("https");
const url = require("url");
const {
	newlineRegex
} = require("../lib/utils").misc;

const user = "jtuu";
const dn = "Esc";
const repo = "capybot";
const branch = "master";

const headers = {
	"user-agent": `NodeJS; jtuu/capybot;`
};

const headUrl = url.parse(`https://api.github.com/repos/${user}/${repo}/git/refs/heads/${branch}`);

function payload(src, msg, type) {
	return new Promise((resolve, reject) => {
		const headReq = https.get({
			host: headUrl.host,
			path: headUrl.path,
			headers
		}, headRes => {
			headRes.setEncoding("utf8");

			let headBody = "";
			headRes.on("data", data => headBody += data);
			headRes.on("end", () => {
				try {
					var parsedBody = JSON.parse(headBody);
				} catch (err) {
					return reject(new Plugin.Response("error when parsing JSON: " + headBody));
				}

				if (parsedBody && parsedBody.object && parsedBody.object.url) {
					const commitUrl = url.parse(parsedBody.object.url);
					const commitReq = https.get({
						host: commitUrl.host,
						path: commitUrl.path,
						headers
					}, commitRes => {
						commitRes.setEncoding("utf8");

						let commitBody = "";
						commitRes.on("data", data => commitBody += data);
						commitRes.on("end", () => {
							try {
								var parsedBody = JSON.parse(commitBody);
							} catch (err) {
								return reject(new Plugin.Response("error when parsing JSON: " + commitBody));
							}

							const commitMsg = parsedBody.message.replace(newlineRegex, "").trim();

							return resolve(new Plugin.Response(`Latest changes to ${repo}: "${commitMsg}". ${repo.charAt(0).toUpperCase() + repo.slice(1)} is made by ${dn}. https://github.com/${user}/${repo}`));
						})
					})
					commitReq.on("error", err => {
						return reject(new Plugin.Response(err));
					});
				} else {
					return reject(new Plugin.Response("could not get commit url from head"))
				}
			})
		});
		headReq.on("error", err => {
			return reject(new Plugin.Response(err));
		});
	})
}

const desc = "Returns information about the capybot repo on GitHub.";

module.exports = new Plugin("capybot", /^!(?:capy)?bot/, payload, desc, 5, true, false, true);
