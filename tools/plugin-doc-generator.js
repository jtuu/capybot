const fs = require("fs");
const pathlib = require("path");

const pluginDir = pathlib.resolve(__dirname + "/../plugins/");
const docPath = pathlib.resolve(__dirname + "/../doc/plugins.md");

const header = `
# Plugins
A document explaining the behaviour of the following built-in plugins:
`;

function getPlugins() {
	return new Promise(resolve => {
		fs.readdir(pluginDir, (err, fileNames) => {
			if (err) return console.error(err);

			let promises = [];
			for (let name of fileNames) {
				promises.push(loadPlugin(pluginDir + "/" + name));
			}

			Promise.all(promises).then(plugins => {
				resolve(plugins.filter(p => p.success).map(p => p.plugin));
			})
		})
	})
}

function loadPlugin(path) {
	return new Promise((resolve, reject) => {
		var plugin = null;
		try {
			plugin = require(path);
		} catch (err) {
			console.error("could not load plugin", err);
		}
		if (plugin) {
			resolve({
				success: true,
				plugin
			})
		} else {
			reject({
				success: false,
				plugin: null
			});
		}
	})
}

function parseTrigger(trigger){
  return trigger ? "`" + trigger + "`" : "any";
}

function pluginToString(plugin) {
	return `
## ${plugin.name}

* **trigger:** ${parseTrigger(plugin.trigger)}
* **public:** ${plugin.channel}
* **private:** ${plugin.whisper}

${plugin.description}
`
}

function generateDoc() {
	var DOC = "";

	DOC += header;

	return new Promise(resolve => {
		getPlugins().then(plugins => {
			plugins.forEach(p => {
				DOC += `\n* [${p.name}](#${p.name})`;
			})

			plugins.forEach(p => {
				DOC += "\n" + pluginToString(p);
			})
			resolve(DOC)
		})
	})
}

function writeToFile(path, contents) {
	fs.writeFile(path, contents, (err) => {
		if (err) return console.error("error when writing file", err);

		console.log("the file was saved");
	})
}


function main() {
	generateDoc().then(doc => {
		writeToFile(docPath, doc);
	})
}
main();
