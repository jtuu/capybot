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
	if(url){
		if(CACHE.has(url)){
			console.log("got title from cache")
			let title = CACHE.get(url);
			this.sayTo("steam", forSteam(title));
			this.sayTo("irc", forIrc(title))
		}else{
			jsdom.env(url, [], (err, window) => {
				if (err) return console.error(err);

		    let title = null;
		    if(
		      window
		      && window.document
		      && (title = window.document.getElementsByTagName("title"))
		      && title
		      && Symbol.iterator in title
		      && title[0]
		    ){
					console.log("got title from dom")
					title = title[0].textContent;
					cache(url, title);
		      this.sayTo("steam", forSteam(title));
					this.sayTo("irc", forIrc(title))
		    }
			})
		}
	}
}

function forIrc(title){
	return title.replace(newlineRegex, "").trim();
}

function forSteam(title){
	return title.trim();
}

module.exports = new Plugin("urltitle", urlRegex, payload);
