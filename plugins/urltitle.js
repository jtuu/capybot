const Plugin = require("../lib/plugin.js");
const http = require("http");
const https = require("https");
const jsdom = require("jsdom");

const urlRegex = /(http(s)?:\/\/\S+)/;
const contentTypeRegex = /text\/(?:ht|x)ml/;
const {newlineRegex} = require("../lib/utils").misc;

const CACHE = new Map();
const cacheSize = 2;

const requestTimeoutMillis = 50000;

function cache(url, title) {
	CACHE.set(url, title);

	if (CACHE.size > cacheSize) {
		CACHE.delete(CACHE.keys().next().value);
	}
}

function payload(src, msg, type) {
	let url = msg.match(urlRegex)[0];
	return new Promise((resolve, reject) => {
		if (url) {
			if (CACHE.has(url)) {
				let title = CACHE.get(url);
				resolve(new Plugin.Response(parseTitle(title)));
			} else {
				let client = http;
				if (url.startsWith("https")) {
					client = https;
				}
				let request = client.get(url, res => {
					res.setEncoding("utf8");

					res.on("error", console.error)

					let html = "";
					if (
						res.headers &&
						res.headers["content-type"] &&
						contentTypeRegex.test(res.headers["content-type"])
					) {
						res.on("data", data => {
							html += data;
						})

						res.on("end", () => {
							let request = jsdom.env({
								html,
								features: {
									SkipExternalResources: true,
									ProcessExternalResources: false,
									FetchExternalResources: false
								},
								parsingMode: "html",
								done: (err, window) => {

									if (err) return reject(new Plugin.Response("bad url or something"));

									let titleElem = null,
										titleText = null;
									if (window) {
										if (
											window.document &&
											(
												(titleElem = window.document.getElementsByTagName("title")[0]) ||
												(titleElem = window.document.querySelector("meta[property='og:title']"))
											) &&
											titleElem &&
											(
												(titleText = titleElem.textContent) ||
												(titleText = titleElem.content)
											)
										) {
											cache(url, titleText);
											resolve(new Plugin.Response(parseTitle(titleText)));
										} else {
											reject(new Plugin.Response("bad title or something"));
										}
										return window.close();
									} else {
										reject(new Plugin.Response("bad title or something"));
									}
								}
							})
						})
					} else {
						request.abort();
						reject(new Plugin.Response("invalid content-type"));
					}
				});
				request.on("error", err => {
					request.abort();
					reject(new Plugin.Response(err));
				});
				request.setTimeout(requestTimeoutMillis, () => {
					reject(new Plugin.Response("request timed out"))
				});
			}
		} else {
			reject(new Plugin.Response("bad url or something"));
		}
	})
}

function parseTitle(title) {
	return {
		steam: title.replace(newlineRegex, "").trim(),
		irc: title.replace(newlineRegex, "").trim()
	}
}

const desc = "Fetches the title of websites.";

module.exports = new Plugin("urltitle", urlRegex, payload, desc, 5, true, false, true);
