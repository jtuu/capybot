const Plugin = require("../lib/plugin.js");
const https = require("https");

const querify = require("../lib/utils").misc.querify;
const baseUrl = "https://www.googleapis.com/customsearch/v1";
const requestTimeoutMillis = 50000;

function payload(src, msg, type) {
	if (!google.config) {
		google.loadConfig();
	}

	const {
		key,
		cx
	} = google.config;

	const q = msg.replace(/^!g\s?/, "");

	return new Promise((resolve, reject) => {
		if (q && key && cx) {
			const url = baseUrl + querify({
				key,
				cx,
				q,
				prettyPrint: false,
				fields: "items(title,link)",
				num: 3
			});

			let req = https.get(url, res => {
				res.setEncoding("utf8");

				let rawBody = "";
				if (res.statusCode === 200) {
					res.on("data", data => rawBody += data);

					res.on("end", () => {
						const body = JSON.parse(rawBody);
						resolve(new Plugin.Response(formatResult(body)));
					})
				} else {
					reject(new Plugin.Response(res.statusCode + " " + res.statusMessage));
				}
			});
			req.on("error", err => {
				req.abort();
				reject(new Plugin.Response(err));
			});
			req.setTimeout(requestTimeoutMillis, () => {
				reject(new Plugin.Response("request timed out"))
			});
		} else {
			reject(new Plugin.Response("invalid parameters"))
		}
	})
}

const maxTitleLength = 30;
const bold = "\x02";
const color = "\x03";

function formatResult(result) {
	return {
		irc: result.items.reduce((stack, item, index) => {
			let title = item.title.trim();
			return stack += `${bold}${
				title.length > maxTitleLength
				? title.substr(0, maxTitleLength - 1).trim() + "…"
				: title
			}${bold} : ${item.link}\n`
		}, ""),
		steam: result.items.reduce((stack, item, index) => {
			let title = item.title.trim();
			return stack += `\n${
				title.length > maxTitleLength * 2
				? title.substr(0, maxTitleLength - 1).trim() + "…"
				: title
			}\n\t${item.link}`
		}, "")
	};
}

const desc = "Does a Google search.";

const google = new Plugin("google", /^!g/, payload, desc, 5, true, false, true);

module.exports = google;
