require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
const cron = require('node-cron');

// Create a new Discord client without message content intent
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// Store server configurations
const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'servers.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load server configurations
function loadServerConfigs() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const rawData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(rawData);
    } else {
      // Create default config if it doesn't exist
      const defaultConfig = { servers: {} };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error loading server configurations:', error);
    return { servers: {} };
  }
}

// Save server configurations
function saveServerConfig(configs) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
    console.log('Server configurations saved successfully!');
  } catch (error) {
    console.error('Error saving server configurations:', error);
  }
}

// Configure a server
function configureServer(guildId, channelId) {
  const configs = loadServerConfigs();
  configs.servers[guildId] = { channelId };
  saveServerConfig(configs);
}

// Get server configuration
function getServerConfig(guildId) {
  const configs = loadServerConfigs();
  return configs.servers[guildId];
}

// Load content from JSON file
function loadContent() {
  try {
    const filePath = path.join(__dirname, 'data', 'content.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading content:', error);
    return { entries: [] };
  }
}

// Save content to JSON file
function saveContent(content) {
  try {
    const filePath = path.join(__dirname, 'data', 'content.json');
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log('Content saved successfully!');
  } catch (error) {
    console.error('Error saving content:', error);
  }
}

// Add new content entry
function addEntry(type, content) {
  const data = loadContent();
  // If it's an emoji, make sure it's in the correct format
  if (type === 'emoji' && !content.startsWith('<:') && !content.startsWith('<a:')) {
    // This is a simple name format, warn about it in console
    console.log(`Warning: Emoji "${content}" might not display correctly without ID. Format should be <:name:id>.`);
  }
  data.entries.push({ type, content });
  saveContent(data);
}

// Get a random entry from the content
function getRandomEntry() {
  const data = loadContent();
  if (data.entries.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * data.entries.length);
  return data.entries[randomIndex];
}

// Post a random entry to a specified Discord channel
async function postRandomEntry(channel) {
  try {
    const entry = getRandomEntry();
    if (!entry) {
      console.log('No entries found to post.');
      return;
    }
    
    await channel.send(entry.content);
    console.log(`Posted ${entry.type}: ${entry.content} to ${channel.guild.name} / #${channel.name}`);
  } catch (error) {
    console.error('Error posting to Discord:', error);
  }
}

// Get a list of all custom emojis in a guild with their IDs
async function getGuildEmojis(guild) {
  try {
    const emojis = await guild.emojis.fetch();
    const emojiList = emojis.map(emoji => ({
      name: emoji.name,
      id: emoji.id,
      animated: emoji.animated,
      format: emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`
    }));
    return emojiList;
  } catch (error) {
    console.error('Error fetching guild emojis:', error);
    return [];
  }
}

// Display all available content
async function displayAllContent(channel) {
  const data = loadContent();
  
  try {
    // Create formatted message for Discord
    let message = '**SottoBot Content List: the following phrases and emojis will run every 30 minutes**\n\n';
    
    if (data.entries.length === 0) {
      message += 'No entries found.';
    } else {
      data.entries.forEach((entry, index) => {
        message += `${index + 1}. [${entry.type}] ${entry.content}\n`;
      });
    }
    
    // Add help for emoji formatting
    message += '\n**Note about emojis:** Custom emojis must be in the format `<:name:id>` to display correctly. Use the `/emoji-list` command to see available emojis with their IDs.';
    
    // Send to Discord
    await channel.send(message);
    console.log(`Content list sent to ${channel.guild.name} / #${channel.name}`);
  } catch (error) {
    console.error('Error sending content list to Discord:', error);
  }
}

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the bot to post in this channel (admin only)'),
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('Display all phrases and emojis the bot can post'),
  new SlashCommandBuilder()
    .setName('post')
    .setDescription('Post a random phrase or emoji right now'),
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a new phrase or emoji to the bot')
    .addStringOption(option => 
      option.setName('content')
        .setDescription('The phrase or emoji to add')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of content')
        .setRequired(true)
        .addChoices(
          { name: 'Phrase', value: 'phrase' },
          { name: 'Emoji', value: 'emoji' }
        )),
  new SlashCommandBuilder()
    .setName('emoji-list')
    .setDescription('Display all available emojis with their IDs'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Simple command to test if slash commands are working'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information'),
];

// Schedule posting for all configured servers
function schedulePostings() {
  cron.schedule('*/30 * * * *', async () => {
    const configs = loadServerConfigs();
    
    for (const [guildId, config] of Object.entries(configs.servers)) {
      try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) continue;
        
        const channel = await guild.channels.fetch(config.channelId);
        if (!channel) continue;
        
        postRandomEntry(channel);
      } catch (error) {
        console.error(`Error posting to guild ${guildId}:`, error);
      }
    }
  });
}

// When the client is ready, run this code
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Register slash commands
  try {
    console.log('Started refreshing application (/) commands.');
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    // Clear existing commands first
    console.log('Clearing existing application commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );
    
    // Register new commands globally
    console.log('Registering global application commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(command => command.toJSON()) },
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    console.log('Manual mode - Bot will exit after checking configurations');
    console.log('Server configurations:', loadServerConfigs());
    
    setTimeout(() => {
      client.destroy();
      process.exit(0);
    }, 2000);
  } else {
    console.log('Bot started in automatic mode. Will post every 30 minutes to configured channels.');
    schedulePostings();
  }
});

// Handle interaction events for slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  console.log(`Command received: ${interaction.commandName} from ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);

  const { commandName } = interaction;

  try {
    if (commandName === 'setup') {
      // Only allow server administrators to set up the bot
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'Only administrators can set up the bot.', ephemeral: true });
      }
      
      configureServer(interaction.guildId, interaction.channelId);
      await interaction.reply(`Bot configured to post in <#${interaction.channelId}>. It will post random messages every 30 minutes!`);
    } 
    else if (commandName === 'list') {
      console.log('Executing list command...');
      try {
        // Reply immediately so the command doesn't time out
        await interaction.reply({ content: 'Fetching content list...', ephemeral: true });
        
        // Then send the content list directly to the channel
        await displayAllContent(interaction.channel);
      } catch (error) {
        console.error('Error in list command:', error);
        await interaction.followUp({ content: 'Error displaying content list.', ephemeral: true });
      }
    }
    else if (commandName === 'post') {
      console.log('Executing post command...');
      try {
        // Reply immediately so the command doesn't time out
        await interaction.reply({ content: 'Posting a random entry...', ephemeral: true });
        
        // Then post directly to the channel
        await postRandomEntry(interaction.channel);
      } catch (error) {
        console.error('Error in post command:', error);
        await interaction.followUp({ content: 'Error posting random content.', ephemeral: true });
      }
    }
    else if (commandName === 'ping') {
      await interaction.reply({ content: 'Pong! Slash commands are working!', ephemeral: true });
    }
    else if (commandName === 'help') {
      const helpMessage = `
**SottoBot Commands**

• \`/setup\` - Configure the bot to post in this channel (admin only)
• \`/list\` - Display all phrases and emojis the bot can post
• \`/post\` - Post a random phrase or emoji right now
• \`/add\` - Add a new phrase or emoji to the bot
• \`/emoji-list\` - Display all available emojis with their IDs
• \`/ping\` - Check if slash commands are working
• \`/help\` - Show this help message

**About Emojis**
Custom emojis must be in the format \`<:name:id>\` to display correctly.
For example: \`<:smile:123456789>\`
Use the \`/emoji-list\` command to see all available emojis with their IDs.
      `;
      await interaction.reply(helpMessage);
    }
    else if (commandName === 'emoji-list') {
      console.log('Executing emoji-list command...');
      try {
        await interaction.reply({ content: 'Fetching emoji list...', ephemeral: true });
        
        const emojiList = await getGuildEmojis(interaction.guild);
        
        if (emojiList.length === 0) {
          await interaction.followUp('No custom emojis found in this server.');
          return;
        }
        
        let message = '**Available Emojis**\n\n';
        emojiList.forEach(emoji => {
          message += `• ${emoji.format} - \`${emoji.format}\`\n`;
        });
        
        if (message.length > 2000) {
          // Split into multiple messages if too long
          const messages = [];
          let currentMessage = '**Available Emojis**\n\n';
          
          for (const emoji of emojiList) {
            const line = `• ${emoji.format} - \`${emoji.format}\`\n`;
            
            if (currentMessage.length + line.length > 1900) {
              messages.push(currentMessage);
              currentMessage = '**Available Emojis (Continued)**\n\n';
            }
            
            currentMessage += line;
          }
          
          if (currentMessage.length > 0) {
            messages.push(currentMessage);
          }
          
          await interaction.channel.send(messages[0]);
          
          for (let i = 1; i < messages.length; i++) {
            await interaction.channel.send(messages[i]);
          }
          
          await interaction.followUp({ content: 'Emoji list sent to channel!', ephemeral: true });
        } else {
          await interaction.channel.send(message);
          await interaction.followUp({ content: 'Emoji list sent to channel!', ephemeral: true });
        }
      } catch (error) {
        console.error('Error in emoji-list command:', error);
        await interaction.followUp({ content: 'Error displaying emoji list.', ephemeral: true });
      }
    }
    else if (commandName === 'add') {
      console.log('Executing add command...');
      try {
        const content = interaction.options.getString('content');
        const type = interaction.options.getString('type');
        
        // Add the new content
        addEntry(type, content);
        
        // Confirm to the user
        await interaction.reply({ content: `Added new ${type}: "${content}"`, ephemeral: true });
      } catch (error) {
        console.error('Error in add command:', error);
        await interaction.reply({ content: 'Error adding content.', ephemeral: true });
      }
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    // Try to respond to the user if possible
    try {
      const errorMessage = 'There was an error processing your command. Please try again later.';
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (err) {
      console.error('Error sending error message:', err);
    }
  }
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN);