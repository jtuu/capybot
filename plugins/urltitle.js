var Plugin = require("../lib/plugin.js");
var jsdom = require("jsdom");


var urlRegex = /(https?:\/\/\S+)/;

function payload(src, msg, type) {
	jsdom.env(msg.match(urlRegex)[0], [], (err, window) => {
		if (err) return console.error(err);

    let title = null;
    if(
      window
      && window.document
      && (title = window.document.getElementsByTagName("title"))
      && title
      && Symbol.iterator in title
      && title[0]
      && (title = title[0].innerHTML)
    ){
      this.sayToBoth(title);
    }
	})
}

module.exports = new Plugin("urltitle", urlRegex, payload);
