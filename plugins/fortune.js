const Plugin = require("../lib/plugin");
const spawn = require("child_process").spawn;
const {
  whitespaceRegex
} = require("../lib/utils").misc;

function payload(src, msg, type) {
	return new Promise((resolve, reject) => {
		const fortune = spawn("fortune", ["-a", "-s"]);

		fortune.stdout.setEncoding("utf8");
    fortune.stderr.setEncoding("utf8");

		fortune.stdout.on("data", data => {
      data = data.replace(whitespaceRegex, " ").trim();
			resolve(new Plugin.Response(data));
		});

		fortune.stderr.on("data", data => {
			reject(new Plugin.Response(data));
		});
	});
}

module.exports = new Plugin("fortune", /^!fortune/, payload, "Prints a random epigram.", 5, true, false, true)
