# Omnibot
A highly configurable twitch chat bot made with Node.js & tmi.js.

# WARNING!!!
## Use at your own risk!
The current versions of Omnibot are very unstable as we change the API very frequently (and also break things pretty often). We're not responsible for any harm this version may cause. To you, your computer, or your twitch chat. Thanks. <3

## Using Omnibot

### Prerequisites
- [Node.js](https://nodejs.org)
- [MongoDB](https://www.mongodb.org)

### Installation
##### Windows
1. Run `install.bat`.
  - The installer should ask you for the path of MongoDB. If you installed to `C:/Program Files/MongoDB` then you can just hit enter. If else, you need to give it the path of the .exe files. Example: `path/to/MongoDB/Server/3.0/bin`
    - To change the path of MongoDB later, you can edit the file `DrathybotAlpha/database/mongo.loc`
2. Edit `options/twitch.cson`:
  - Replace `identity.username` with the username of your bot.
  - Replace `identity.password` with your bot's [oauth key](http://www.twitchapps.com/tmi/).
  - Add your channel name to the `channels` array.
3. To start the bot, run `Drathybot.vbs`

### Use
- Omnibot accepts no commands from the console, but you can use `Ctrl`+`C` to close it.

### Documentation
- `!stop`:
  - Shuts off the bot. Normal viewers can't use this command.
- `!uptime`:
  - Says how long the stream has been live for.
- `!time <user=[executor]>`:
  - Says how many minutes the viewer has logged.
- Points:
  - Points are the loyalty system of Omnibot. By being in the chat while the stream is live, you earn points.
  - `!balance <user=[executor]>`:
    - Tells a user how many points they have.
  - `!top <number=[default=3]>`:
    - Lists the users with the most points.
  - `!tax <amount | *> from <user | *>`:
    - Takes an amount (or all) of the points from a user (or all users)
    - Defaults to broadcaster only.
  - `!distribute <amount> to <user | *>`:
    - Adds an amount of points to the user's (or all users') balance(s)
    - Defaults to broadcaster only.
- Quotes:
  - Someone said something funny, but it's probably going to get forgotten? Not anymore! Introducing: Omnibot Quotes!
  - `!quote <author> <quote..>`:
    - Adds a quote to the database.
  - `!recite <author=[random]>`:
    - Recites a random quote.
- Custom Commands:
  - Tired of viewers never looking at your description? Like, ever? No problem! If someone asks a FAQ, your moderators are ready. Just have them type a custom command!
  - `!command add <name> <content>`:
    - Adds a command with the specified content. Custom commands can be used just like normal commands.
  - `!command edit <name> <newContent>`:
    - Replace the content of a command.
  - `!command remove <name>`:
    - Removes a command.
  - `!command rename <oldName> <newName>`:
    - Renames a command.
  - `!command rank <name> <rank>`:
    - Change the rank of a command.
    - Rank can be `new`, `viewer`, `mod`, `admin`

### Links
  - To see what we're up to, our [Trello](https://trello.com/b/zUJNkwOP/omnibot)
  - Check out our streams:
    - [Drathy](http://www.twitch.tv/drathy)
    - [Aari](http://www.twitch.tv/aaritak)
