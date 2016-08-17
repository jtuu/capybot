const Plugin = require("../lib/plugin.js");
const steamPerms = require("steam").EChatPermission;
const {
	defaultReason
} = require("../lib/utils").misc;

const trigger = /^!(?:(k)(?:ick)?(b)(?:an)?|(k)(?:ick)?|(b)(?:an)?|(u)(?:n)?(b)(?:an)?|(o)(?:p|per)?)\b/;

function payload(src, msg, type) {
	let action = msg.match(trigger).slice(1).join("");
	let [target, reason] = msg.replace(trigger, "").trim().split(/\s(.*$)/);

	var actionCheck = () => {
		if (action && target) {
			switch (action) {
				case "k":
					kick.call(this, src, target, reason, type);
					break;
				case "b":
					ban.call(this, src, target, reason, type);
					break;
				case "kb":
					ban.call(this, src, target, reason, type);
					kick.call(this, src, target, reason, type);
					break;
				case "ub":
					unban.call(this, src, target, reason, type);
					break;
				case "o":
					oper.call(this, src, target, reason, type);
					break;
				default:
					console.log("Unexpected input");
					break;
			}
		}
	}
	if(type === "steam"){
		this.irc.once("selfMessage", actionCheck);
	}else{
		actionCheck();
	}
}

function kick(actor, target, reason = defaultReason, type) {
	if (type === "steam") {
		let {
			permissions
		} = this.steam.friends.chatRooms[this.room_id][actor];
		if (permissions & steamPerms.Kick) {
			this.irc.send("kick", this.channel, target, reason);
		}
	} else if (type === "irc") {
		this.irc.send("names", this.channel);
		this.irc.once("names" + this.channel, nicks => {
			if (nicks[actor] === "@") {
				Object.keys(this.steam.friends.personaStates)
					.filter(id => this.steam.friends.personaStates[id].player_name === target)
					.slice(0, 1)
					.forEach(id => this.steam.friends.kick(this.room_id, id));
			}
		})
	}
}

function ban(actor, target, reason = defaultReason, type) {
	if (type === "steam") {
		let {
			permissions
		} = this.steam.friends.chatRooms[this.room_id][actor];
		if (permissions & steamPerms.Ban) {
			this.irc.send("mode", this.channel, "+b", target);
		}
	} else if (type === "irc") {
		this.irc.send("names", this.channel);
		this.irc.once("names" + this.channel, nicks => {
			if (nicks[actor] === "@") {
				Object.keys(this.steam.friends.personaStates)
					.filter(id => this.steam.friends.personaStates[id].player_name === target)
					.slice(0, 1)
					.forEach(id => this.steam.friends.ban(this.room_id, id));
			}
		})
	}
}

function unban(actor, target, reason = defaultReason, type){
	if(type === "steam"){
		let {
			permissions
		} = this.steam.friends.chatRooms[this.room_id][actor];
		if (permissions & steamPerms.Ban) {
			this.irc.send("mode", this.channel, "-b", target);
		}
	}else if(type === "irc"){
		this.irc.send("names", this.channel);
		this.irc.once("names" + this.channel, nicks => {
			if (nicks[actor] === "@") {
				Object.keys(this.steam.friends.personaStates)
					.filter(id => this.steam.friends.personaStates[id].player_name === target)
					.slice(0, 1)
					.forEach(id => this.steam.friends.unban(this.room_id, id));
			}
		})
	}
}

function oper(actor, target, reason = defaultReason, type){
	if(type === "steam"){
		let {
			permissions
		} = this.steam.friends.chatRooms[this.room_id][actor];
		if (permissions & steamPerms.OfficerDefault) {
			this.irc.send("mode", this.channel, "+o", target);
		}
	}
}

const desc = "Kick or ban users.";

module.exports = new Plugin("moderate", trigger, payload, desc, 5, true, false, false);
