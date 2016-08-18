const Plugin = require("../lib/plugin.js");
const http = require("follow-redirects").http;
const https = require("follow-redirects").https;
const jsdom = require("jsdom");

const urlRegex = /(http(s)?:\/\/\S+)/;
const contentTypeRegex = /text\/(?:ht|x)ml/;
const contentEncodingRegex = /gzip/;
const {
	newlineRegex,
	unzip
} = require("../lib/utils").misc;

const CACHE = new Map();
const cacheSize = 2;

const requestTimeoutMillis = 50000;

//store url : title pair
function cache(url, title) {
	CACHE.set(url, title);

	//delete last if cache is full
	if (CACHE.size > cacheSize) {
		CACHE.delete(CACHE.keys().next().value);
	}
}

function payload(src, msg, type) {
	let url = msg.match(urlRegex)[0]; //get url from message (only 1 per message for now)
	return new Promise((resolve, reject) => {
		if (url) {
			//just return the title if we already have it
			if (CACHE.has(url)) {
				let title = CACHE.get(url);
				resolve(new Plugin.Response(parseTitle(title)));
			} else {
				//we don't have it in the cache
				//start the request procedure

				//have to use different clients depending on wether the url is http or https
				let client = http;
				if (url.startsWith("https")) {
					client = https;
				}

				//start the GET
				let request = client.get(url, res => {
					res.on("error", console.error)

					let html = ""; //the main body stack for non-gzipped documents

					//check the content-type of the response
					if (
						res.headers &&
						res.headers["content-type"] &&
						contentTypeRegex.test(res.headers["content-type"])
					) {
						let useGzip = false;
						let dataQueue = []; //the stack for gzipped documents

						//check content-encoding
						if (
							res.headers["content-encoding"] &&
							contentEncodingRegex.test(res.headers["content-encoding"])
						) {
							useGzip = true;
						} else {
							//default to utf8
							res.setEncoding("utf8");
						}

						res.on("data", data => {
							//push chunks to stack
							if (useGzip) {
								dataQueue.push(data);
							} else {
								html += data;
							}
						})

						res.on("end", () => {
							//wait for data to be processed
							unzip(Buffer.concat(dataQueue)).then(buf => {
								if (useGzip) {
									html = buf.toString("utf8");
								}
								//parse the document
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

										let titleElem = null,
											titleText = null;
										if (window) {
											if (
												window.document &&
												(
													//get the <title> tag or og:title
													(titleElem = window.document.getElementsByTagName("title")[0]) ||
													(titleElem = window.document.querySelector("meta[property='og:title']"))
												) &&
												titleElem &&
												(
													(titleText = titleElem.textContent) ||
													(titleText = titleElem.content)
												)
											) {
												//we got the title, cache and send it off
												cache(url, titleText);
												return resolve(new Plugin.Response("\x02" + parseTitle(titleText)));
											} else {
												return reject(new Plugin.Response("could not find title in document"));
											}
											//finally close the window (apparently this frees up the memory)
											return window.close();
										} else {
											reject(new Plugin.Response("no window object"));
										}
									}
								})
							}).catch(err => {
								reject(new Plugin.Response(err));
							})
						})
					} else {
						//content-type was not what we want so let's not proceed
						request.abort();
						reject(new Plugin.Response("invalid content-type"));
					}
				});
				request.on("error", err => {
					request.abort();
					reject(new Plugin.Response(err));
				});
				//kill the connection if it's taking too long
				request.setTimeout(requestTimeoutMillis, () => {
					request.abort();
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

var urltitle = new Plugin("urltitle", urlRegex, payload, desc, 5, true, false, true);
module.exports = urltitle;
