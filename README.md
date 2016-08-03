# capybot
A chat bot

***

## Features
* Steam and IRC connectivity
* Plugin API and hotloading

## Installation
```
npm install git://github.com/jtuu/capybot.git --no-optional
```

## Usage

#### config.json

**username**
steam username used for login

**password**
steam password used for login

**room_id**
the id of the steam group

**server**
irc server to connect to

**nick**
nickname to use on irc

**channel**
irc channel to join

***

## Plugin API
### PluginLoader

Loads and manages plugins in a directory.

```
new PluginLoader(pluginDir, noCache, watch)
```
##### pluginDir
*string* - path to the directory to load plugins from
##### noCache
*Boolean* - enable uncached plugin loading
##### watch
*Boolean* - enable watching the plugins for changes


### Plugin
Wrapper class for plugins. When the trigger is found in a chat message the payload is invoked. The plugins are called in the clients context.
```
new Plugin(name, trigger, payload)
```
**name**

*string* - the name of the plugin

**trigger**

*string|RegExp* - the pattern to search for in messages

**payload**

*function* - the function that will be invoked when the trigger is found, takes the arguments `src, msg, type`

**src**

*string* - either the nickname or the steamID of the sender

**msg**

*string* - the full chat message received

**type**

*string* - the type of the triggering message, either `steam` or `irc`

#### Example

plugins/myplugin.js
```js
var Plugin = require("../lib/plugin");
module.exports = new Plugin("myPlugin", "!trigger", function(src, msg, type){
  /* do something */
})
```
