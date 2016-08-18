const Plugin = require("../lib/plugin.js");
const https = require("https")

const baseUrl = "https://translate.google.com/translate_a/single?client=gtx&ie=UTF-8&oe=UTF-8&dt=ld&dt=qca&dt=t";

const languages = [
	"af",
	"sq",
	"ar",
	"hy",
	"az",
	"eu",
	"be",
	"bn",
	"bs",
	"bg",
	"ca",
	"ceb",
	"ny",
	"zh-CN",
	"zh-TW",
	"hr",
	"cs",
	"da",
	"nl",
	"en",
	"eo",
	"et",
	"tl",
	"fi",
	"fr",
	"gl",
	"ka",
	"de",
	"el",
	"gu",
	"ht",
	"ha",
	"iw",
	"hi",
	"hmn",
	"hu",
	"is",
	"ig",
	"id",
	"ga",
	"it",
	"ja",
	"jw",
	"kn",
	"kk",
	"km",
	"ko",
	"lo",
	"la",
	"lv",
	"lt",
	"mk",
	"mg",
	"ms",
	"ml",
	"mt",
	"mi",
	"mr",
	"mn",
	"my",
	"ne",
	"no",
	"fa",
	"pl",
	"pt",
	"ma",
	"ro",
	"ru",
	"sr",
	"st",
	"si",
	"sk",
	"sl",
	"so",
	"es",
	"su",
	"sw",
	"sv",
	"tg",
	"ta",
	"te",
	"th",
	"tr",
	"uk",
	"ur",
	"uz",
	"vi",
	"cy",
	"yi",
	"yo",
	"zu"
]

function payload(src, msg, type) {
	let useSource = true;
	let url = baseUrl;

	msg = msg.slice(11);
	let [sl, tl] = msg.split(" ");

	return new Promise((resolve, reject) => {
		if (languages.indexOf(sl) === -1) {
			return resolve(new Plugin.Response("Invalid language"));
		}
		msg = msg.slice(sl.length + 1);
		if (languages.indexOf(tl) === -1) {
			useSource = false;
			tl = sl;
			url += "&tl=" + tl;
		} else {
			msg = msg.slice(tl.length + 1);
			url += "&sl=" + sl + "&tl=" + tl;
		}
		url += "&q=" + encodeURIComponent(msg);

		https.get(url, res => {
      if(res.statusCode !== 200){
        return reject(new Plugin.Response(res.statusCode + " " + res.statusMessage));
      }

			res.setEncoding("utf8");

			let body = "";
			res.on("data", data => body += data);
			res.on("end", () => {
				return resolve(new Plugin.Response(body.split('"')[1]));
			})
		})
	})
}

const desc = "Google Translate";

module.exports = new Plugin("translate", /^!translate/, payload, desc, 5, true, false, true);
