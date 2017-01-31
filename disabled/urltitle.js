const Plugin = require("../lib/plugin.js");
const jsdom = require("jsdom");
const request = require("request");
const iconv = require("iconv-lite");

const httpEquivCharsetRegex = /charset=(\S+)/i;
const contentTypeRegex = /text\/(?:ht|x)ml/;
const urlRegex = /(http(s)?:\/\/\S+)/;
const {
	newlineRegex
} = require("../lib/utils").misc;

const CACHE = new Map();
const cacheSize = 2;

const requestTimeoutMillis = 50000;

const headers = {
	"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:48.0) Gecko/20100101 Firefox/48.0",
	"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Encoding": "gzip, deflate"
};

//store url : title pair
function cache(url, title) {
	CACHE.set(url, title);

	//delete last if cache is full
	if (CACHE.size > cacheSize) {
		CACHE.delete(CACHE.keys().next().value);
	}
}

function encodeUrl(url) {
	try {
		if (url === decodeURI(url)) {
			url = encodeURI(url);
		}
	} catch (ex) {
		console.error(ex);
	}
	return url;
}

function checkInlineEncoding(html) {
	return new Promise((resolve, reject) => {
		jsdom.env({
			html,
			features: {
				SkipExternalResources: true,
				ProcessExternalResources: false,
				FetchExternalResources: false
			},
			done: (err, window) => {
				if (err) return reject(err);

				if (window) {
					let encoding = null;
					let doc = window.document;

					let httpEquiv = (
						doc.querySelector("meta[http-equiv='Content-Type']") ||
						doc.querySelector("meta[http-equiv='content-type']")
					);

					if (httpEquiv) {
						let content = (httpEquiv.getAttribute("content") || httpEquiv.getAttribute("CONTENT"));
						if (content) {
							let match = content.match(httpEquivCharsetRegex);
							if (match && match[1]) {
								encoding = match[1].trim().toLowerCase();
								window.close();
								return resolve({
									encoding,
									doc
								});
							}
						}
					}

					let metaCharset = doc.querySelector("meta[charset]");
					if (metaCharset) {
						encoding = (metaCharset.getAttribute("charset") || metaCharset.getAttribute("CHARSET"));
						window.close();
						return resolve({
							encoding,
							doc
						})
					}
					window.close();
					return resolve({
						encoding,
						doc
					});
				} else {
					resolve({
						encoding: null,
						doc: null
					});
				}
			}
		})
	})
}

function payload(src, msg, type) {
	const url = encodeUrl(msg.match(urlRegex)[0]);
	const options = {
		method: "GET",
		url,
		headers,
		timeout: 5000,
		gzip: true,
		followRedirect: true,
		encoding: null
	};
	return new Promise((resolve, reject) => {
		var req = request(options, (err, res, body) => {
			if (err) return reject(new Plugin.Response(err));

			checkInlineEncoding(body.toString("utf8")).then(result => {
				return iconv.decode(body, result.encoding || "utf8");
			}).then(html => {
				jsdom.env({
					html,
					features: {
						SkipExternalResources: true,
						ProcessExternalResources: false,
						FetchExternalResources: false
					},
					parsingMode: "html",
					done: (err, window) => {
						if (err) return reject(new Plugin.Response(err));

						if (window) {
							const title = getTitle(window.document);
							if (title) {
								cache(url, title);
								return resolve(new Plugin.Response(parseTitle(title)));
							} else {
								return reject(new Plugin.Response("could not find title in document"));
							}
							window.close();
						} else {
							reject(new Plugin.Response("no window object"));
						}
					}
				})
			}).catch(err, console.error)
		}).on("response", res => {
			if (res.headers && res.headers["content-type"] && contentTypeRegex.test(res.headers["content-type"])) {

			} else {
				req.abort();
				return reject(new Plugin.Response("invalid content-type"))
			}
		}).on("error", err => reject(new Plugin.Response(err)));
	})
}

function parseTitle(title) {
	return {
		steam: title.replace(newlineRegex, "").trim(),
		irc: "\x02" + title.replace(newlineRegex, "").trim()
	}
}

function getTitle(doc) {
	let titleElem = null,
		titleText = null;
	if (
		(
			(titleElem = doc.getElementsByTagName("title")[0]) ||
			(titleElem = doc.querySelector("meta[property='og:title']")) ||
			(titleElem = doc.querySelector("meta[name='title']"))
		) &&
		titleElem &&
		(
			(titleText = titleElem.textContent) ||
			(titleText = titleElem.content)
		)
	) {
		return titleText;
	} else {
		return null;
	}
}

const desc = "Fetches the title of websites.";

var urltitle = new Plugin("urltitle", urlRegex, payload, desc, 5, true, false, true);
module.exports = urltitle;
