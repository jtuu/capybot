var Plugin = require("../lib/plugin.js");

var answers = [
	"It is certain",
	"It is decidedly so",
	"Without a doubt",
	"Yes, definitely",
	"You may rely on it",
	"As I see it, yes",
	"Most likely",
	"Outlook good",
	"Yes",
	"Signs point to yes",
	"Reply hazy try again",
	"Ask again later",
	"Better not tell you now",
	"Cannot predict now",
	"Concentrate and ask again",
	"Don't count on it",
	"My reply is no",
	"My sources say no",
	"Outlook not so good",
	"Very doubtful"
];
var count = answers.length;
var prefix = "8-ball says:";

function randomAnswer() {
	return answers[Math.floor(Math.random() * count)];
}

function payload(src, msg, type) {
	let message = `${prefix} ${randomAnswer()}`;
	return new Promise(resolve => {
		resolve(new Plugin.Response(message));
	});
}

const desc = "Responds to a yes or no question,";

module.exports = new Plugin("8ball", /^!8ball/, payload, desc, 5, true, false, true);
