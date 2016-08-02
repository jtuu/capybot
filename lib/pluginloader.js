const fs = require("fs");
const path = require("path");
const utils = require("./utils");
const log = utils.loggers.log;

const PluginLoader = class PluginLoader {
	constructor(
		pluginDir = "./plugins",
		noCache = true,
		watch = true
	) {
		this.plugins = {};

		this.pluginDir = path.resolve(pluginDir);
		this.noCache = noCache; //boolean to enable hotloading
		this.watch = watch; //boolean to enable watch

		this.watchTimeout = null; //cooldown for watch events

		if (this.watch) {
			//check if given path can be used
			fs.stat(this.pluginDir, (err, stats) => {
				if (err) return log(`watch ${this.pluginDir} failed`, err);

				//setup watch to load changed plugins
				log(`watching ${this.pluginDir}`);
				fs.watch(this.pluginDir, {
					persistent: false,
					recursive: false,
					encoding: "utf8"
				}, (eventType, filename) => {
					if (!this.watchTimeout) {
						log(`${filename} changed...`);
						this.load(filename);
						//set cooldown timer
						this.watchTimeout = setTimeout(() => this.watchTimeout = null, 5000);
					}
				})
			})
		}
	}

	//should probably be in utils
	//searches require.cache for modules
	searchCache(moduleName) {
		return new Promise(res => {
			let module = require.cache[require.resolve(moduleName)];
			if (!module) {
				return res([]);
			}
			res(
				(function traverse(stack, module) {
					module.children.forEach(child => {
						stack = traverse(stack, child);
					})
					stack.push(module);
					return stack;
				})([], module)
			)
		})
	}

	//deletes modules from require.cache and pathcache
	purgeCache(moduleName) {
		return Promise.all([
			new Promise(res => {
				this.searchCache(moduleName).then(result => {
					for (let module of result) {
						delete require.cache[module.id];
					}
					res();
				})
			}),
			new Promise(res => {
				for (let cacheKey of Object.keys(module.constructor._pathCache)) {
					if (cacheKey.indexOf(moduleName) > 0) {
						delete module.constructor._pathCache[cacheKey];
					}
				}
				res();
			})
		]);
	}

	//load all plugins
	loadAll() {
		return new Promise((topres, toprej) => {
			new Promise((res, rej) => {
				//read filenames in dir
				fs.readdir(this.pluginDir, function(err, filenames) {
					if (err) return rej([]);

					res(filenames);
				})
			}).then(filenames => {
				//then load them
				this.load(filenames).then(plugins => {
					topres(plugins);
				})
			})
		})
	}

	//load some plugins
	load(filenames) {
		filenames = Array.isArray(filenames) ? filenames : [filenames];

		return Promise.all(filenames.map(
			//map filenames to promises containing failed or loaded plugins
			filename => {
				return new Promise((res, rej) => {
					let pluginPath = `${this.pluginDir}/${filename}`; //absolute path of the plugin

					fs.stat(pluginPath, (err, stats) => {
						if (err) throw err;

						//check if it's a file, might want some better validation here?
						if (stats.isFile()) {
							let plugin = null;
							let promises = [new Promise(res => res())]; //noop

							if (this.noCache) {
								//purge cache
								promises = [
									this.purgeCache(pluginPath),
									this.purgeCache("./plugin.js"),
									new Promise(res => {
										//for some reason it wont fucking load the exports
										//from the plugin without this
										setTimeout(res, 500);
									})
								];
							}
							Promise.all(promises).then(() => {
								try {
									//just attempt to load the plugin
									//will check that the file exists and that it's valid js ofc
									plugin = require(pluginPath);
								} catch (err) {
									log(`could not load plugin ${filename}`, err);
								}

								//an empty object is truthy so we have to manually check for those
								//(empty object means the exports probably fucked up)
								let success = plugin && typeof plugin === "object" && Object.keys(plugin).length > 0;

								if (success) {
									log(`loaded plugin ${filename}`);
									this.plugins[plugin.name] = plugin; //save to parent
								}

								res({
									success,
									plugin
								});
							})
						}
					})
				})
			}
		));
	}
}

module.exports = PluginLoader;
