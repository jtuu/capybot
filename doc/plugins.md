
# Plugins
A document explaining the behaviour of the following built-in plugins:

* [8ball](#8ball)
* [autoop](#autoop)
* [decide](#decide)
* [dice](#dice)
* [fortune](#fortune)
* [google](#google)
* [help](#help)
* [logger](#logger)
* [moderate](#moderate)
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


## decide

* **trigger:** `/^!decide\s(?!.*or\sor).+?\sor\s(?!.*or).+/`
* **public:** true
* **private:** false




## dice

* **trigger:** `/^!dice\s\d+d\d/`
* **public:** true
* **private:** false

Roll dice.


## fortune

* **trigger:** `/^!fortune/`
* **public:** true
* **private:** false

Prints a random epigram.


## google

* **trigger:** `/^!g/`
* **public:** true
* **private:** false

Does a Google search.


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


## moderate

* **trigger:** `/^!(?:(k)(?:ick)?(b)(?:an)?|(k)(?:ick)?|(b)(?:an)?|(u)(?:n)?(b)(?:an)?)\b/`
* **public:** true
* **private:** false

Kick or ban users.


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

Relays messages and actions (joins, parts, quits, kicks, bans etc.) between IRC and Steam.


## urltitle

* **trigger:** `/(http(s)?:\/\/\S+)/`
* **public:** true
* **private:** false

Fetches the title of websites.


## userlist

* **trigger:** `/^!userlist/`
* **public:** true
* **private:** true

Makes the bot whisper you with a list of all the users that are on the other side of the chat.
