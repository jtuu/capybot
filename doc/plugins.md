
# Plugins
A document explaining the behaviour of the following built-in plugins:

* [8ball](#8ball)
* [autoop](#autoop)
* [help](#help)
* [logger](#logger)
* [noop](#noop)
* [ping](#ping)
* [quotes](#quotes)
* [rejoin](#rejoin)
* [relay](#relay)
* [urltitle](#urltitle)
* [userlist](#userlist)

## 8ball

* **trigger:** `/^!8ball/`
* **public:** true
* **private:** false

Responds to a yes or no question,


## autoop

* **trigger:** any
* **public:** true
* **private:** false

Sets +o for specified users when they join.


## help

* **trigger:** `/^!help/`
* **public:** true
* **private:** true

Returns a link to this document.


## logger

* **trigger:** any
* **public:** true
* **private:** false

Saves messages to a database (Postgres).


## noop

* **trigger:** `/$./`
* **public:** true
* **private:** false

Used for debugging purposes.


## ping

* **trigger:** `!ping`
* **public:** true
* **private:** true

Responds with 'pong'.


## quotes

* **trigger:** `/^!quote/`
* **public:** true
* **private:** false

Returns a random message from a database (Postgres). Can take in a regex pattern as an argument. The pattern is used to limit the search to only messages that contain that pattern.


## rejoin

* **trigger:** `/^!rejoin/`
* **public:** true
* **private:** true

Makes the bot leave and rejoin Steam chat.


## relay

* **trigger:** any
* **public:** true
* **private:** false

Relays messages and actions (joins, parts, quits, kicks, bans) between IRC and Steam.


## urltitle

* **trigger:** `/(https?:\/\/\S+)/`
* **public:** true
* **private:** false

Fetches the contents of the `<title>` tag of any website


## userlist

* **trigger:** `/^!userlist/`
* **public:** true
* **private:** true

Makes the bot whisper you with a list of all the users that are on the other side of the chat.
