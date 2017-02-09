
# Plugins
A document explaining the behaviour of the following built-in plugins:

* [8ball](#8ball)
* [capybot](#capybot)
* [decide](#decide)
* [dice](#dice)
* [fortune](#fortune)
* [google](#google)
* [help](#help)
* [logger](#logger)
* [noop](#noop)
* [ping](#ping)
* [quotes](#quotes)
* [rejoin](#rejoin)
* [remove](#remove)
* [seen](#seen)
* [send](#send)
* [translate](#translate)
* [urban](#urban)
* [wolfram](#wolfram)

## 8ball

* **trigger:** `/^!8ball/`
* **public:** true
* **private:** false

Responds to a yes or no question.


## capybot

* **trigger:** `/^!(?:capy)?bot/`
* **public:** true
* **private:** false

Returns information about the capybot repo on GitHub.


## decide

* **trigger:** `/^!decide\s(?!.*\sor\sor).+?\sor\s(?!.*\sor).+/`
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

Logs activity to a database.


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


## remove

* **trigger:** `/^!remove/`
* **public:** true
* **private:** false

Removed


## seen

* **trigger:** `/^!seen/`
* **public:** true
* **private:** false

Returns the date a user was last seen.


## send

* **trigger:** `/^!send/`
* **public:** true
* **private:** false

Sent ;)


## translate

* **trigger:** `/^!translate/`
* **public:** true
* **private:** false

Google Translate


## urban

* **trigger:** `/^!ud/`
* **public:** true
* **private:** false

Search for a definition in Urban Dictionary.


## wolfram

* **trigger:** `/^!(?:wa|wolfram)/`
* **public:** true
* **private:** false

Query Wolfram Alpha.
