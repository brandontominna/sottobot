# SottoBot - Discord Emoji & Phrase Scheduler

A Discord bot that automatically posts random emojis and phrases to a specified channel every 30 minutes.

## Quick Add Instructions

Want to add this bot to your Discord server? Just follow these simple steps:

1. **Add the bot to your server** using this link: [Add SottoBot to Discord](https://discord.com/oauth2/authorize?client_id=1357948511219613696&permissions=330816&integration_type=0&scope=bot)

2. **Set up the bot** in the channel where you want it to post:
   ```
   /setup
   ```
   (You must have Administrator permissions to do this)

3. **That's it!** The bot will now post random phrases and emojis in that channel every 30 minutes.

## Bot Commands

- `/setup` - Configure the channel for automatic posts (Admin only)
- `/list` - Show all phrases and emojis the bot can post
- `/post` - Post a random phrase or emoji right now
- `/add` - Add a new phrase or emoji to the bot
- `/help` - Show help information

## Detailed Setup Instructions

### For Bot Users

1. Ask your server administrator to add the bot using the link above
2. Go to the channel where you want the bot to post
3. Type `/setup` to configure the bot
4. Use `/list` to see all the possible messages

### For Bot Developers

#### Prerequisites

- Node.js (v14 or newer)
- A Discord account and a Discord server where you have admin permissions
- A Discord bot token (from [Discord Developer Portal](https://discord.com/developers/applications))

#### Setting Up the Bot

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Running 24/7

To keep the bot running 24/7, you can:

1. **Use a cloud service** like Railway, Heroku, AWS, or Google Cloud
2. **Use a VPS** (Virtual Private Server)
3. **Use a process manager** like PM2:
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the bot with PM2
   pm2 start index.js
   
   # Make it start on system boot
   pm2 startup
   pm2 save
   ```

## Customizing Content

To modify the phrases and emojis the bot can post, edit the `data/content.json` file.

## License

ISC

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements.
