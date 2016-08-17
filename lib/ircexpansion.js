//adds methods to node-irc
//for now it only adds one method
function expandIrc(Irc) {
	Irc.Client.prototype.expanded = true;

	//irssi style "wii" (whois with mask)
	Irc.Client.prototype.wii = function(nick, callback) {
		if (typeof callback === 'function') {
			var callbackWrapper = function(info) {
				if (info.nick.toLowerCase() == nick.toLowerCase()) {
					this.removeListener('whois', callbackWrapper);
					return callback.apply(this, arguments);
				}
			};
			this.addListener('whois', callbackWrapper);
		}
		this.send('WHOIS', nick, nick);
	}
}

module.exports = expandIrc;
