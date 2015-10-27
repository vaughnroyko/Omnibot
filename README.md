# Omnibot
A highly configurable twitch chat bot made with Node.js & tmi.js.

## Warning!
### Use at your own risk
The current versions of Omnibot are unstable. We change the API very frequently (and also break things pretty often). Unit tests are coming eventually, and when that happens it'll go much smoother. At the moment, tho, it's still kinda a mess. This is just a disclaimer, you can use this version if you like. It'll probably work fine! But keep in mind that we're not responsible for any harm this version may cause. To you, your computer, or your twitch chat. Thanks. <3

## Using Omnibot

### Prerequisites
- [Node.js](https://nodejs.org)
- [MongoDB](https://www.mongodb.org)

### Installation
##### Windows
1. Run `install.bat`.
  - The installer should ask you for the path of MongoDB. If you installed to `C:/Program Files/MongoDB` then you can just hit enter. If else, you need to give it the path of the .exe files. Example: `path/to/MongoDB/Server/3.0/bin`
    - To change the path of MongoDB later, you can edit the file `Omnibot/database/mongo.loc`
2. Run the bot using `Omnibot.vbs`. It will generate files, but should not turn on quite yet.
3. Edit the generated file `options/twitch.cson`:
  - Replace `identity.username` with the username of your bot.
  - Replace `identity.password` with your bot's [oauth key](http://www.twitchapps.com/tmi/).
  - Set `channel` to the channel you'd like the bot to connect to.
4. You're done! Start the bot the same way whenever you like. If you'd like to change any other config files, feel free to. We'd recommend leaving the defaults as is tho!
##### Other
1. Run MongoDB.
2. Run the bot with Node.js.
  - `cd <path to the Omnibot folder>`
  - `node .`
  It will generate files, but should not turn on quite yet.
3. Edit the generated file `options/twitch.cson`:
  - Replace `identity.username` with the username of your bot.
  - Replace `identity.password` with your bot's [oauth key](http://www.twitchapps.com/tmi/).
  - Set `channel` to the channel you'd like the bot to connect to.
4. You're done! Start the bot the same way whenever you like. If you'd like to change any other config files, feel free to. We'd recommend leaving the defaults as is tho!

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
