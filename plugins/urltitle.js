const Plugin = require("../lib/plugin.js");
const jsdom = require("jsdom");

const urlRegex = /(https?:\/\/\S+)/;
const newlineRegex = /\r?\n|\r/g;

const CACHE = new Map();
const cacheSize = 2;

function cache(url, title){
	CACHE.set(url, title);

	if(CACHE.size > cacheSize){
		CACHE.delete(CACHE.keys().next().value);
	}
}

function payload(src, msg, type) {
	let url = msg.match(urlRegex)[0];
	return new Promise((resolve, reject) => {
		if(url){
			if(CACHE.has(url)){
				let title = CACHE.get(url);

				resolve(new Plugin.Response(title));
			}else{
				jsdom.env(url, [], (err, window) => {
					if (err) return reject(new Plugin.Response("bad url or something"));

			    let title = null;
			    if(
			      window
			      && window.document
			      && (title = window.document.getElementsByTagName("title"))
			      && title
			      && Symbol.iterator in title
			      && title[0]
			    ){
						title = title[0].textContent;
						cache(url, title);
			      resolve(new Plugin.Response(title));
			    }else{
						reject(new Plugin.Response("bad title or something"));
					}
				})
			}
		}else{
			reject(new Plugin.Response("bad url or something"));
		}
	})
}

function parseTitle(title){
	return title.replace(newlineRegex, "").trim();
}

module.exports = new Plugin("urltitle", urlRegex, payload, true, false, true);
