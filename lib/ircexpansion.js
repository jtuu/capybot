function expandIrc(Irc) {
	Irc.Client.prototype.expanded = true;

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
