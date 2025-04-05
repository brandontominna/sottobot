require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the content JSON file
const CONTENT_FILE_PATH = path.join(__dirname, 'data', 'content.json');

// Load content from JSON file
function loadContent() {
  try {
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const rawData = fs.readFileSync(CONTENT_FILE_PATH, 'utf8');
      return JSON.parse(rawData);
    } else {
      return { entries: [] };
    }
  } catch (error) {
    console.error('Error loading content:', error);
    return { entries: [] };
  }
}

// Save content to JSON file
function saveContent(content) {
  try {
    fs.writeFileSync(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf8');
    console.log('Content saved successfully!');
  } catch (error) {
    console.error('Error saving content:', error);
  }
}

// Add a new entry
function addEntry(type, content) {
  const data = loadContent();
  data.entries.push({ type, content });
  saveContent(data);
  console.log(`Added new ${type}: ${content}`);
}

// Remove an entry by index
function removeEntry(index) {
  const data = loadContent();
  if (index >= 0 && index < data.entries.length) {
    const removed = data.entries.splice(index, 1)[0];
    saveContent(data);
    console.log(`Removed: ${removed.type} - ${removed.content}`);
  } else {
    console.log('Invalid index.');
  }
}

// List all entries
function listEntries() {
  const data = loadContent();
  console.log('\n===== Current Entries =====');
  if (data.entries.length === 0) {
    console.log('No entries found.');
  } else {
    data.entries.forEach((entry, index) => {
      console.log(`${index}. [${entry.type}] ${entry.content}`);
    });
  }
  console.log('===========================\n');
}

// Show the menu
function showMenu() {
  console.log('\n===== Emoji & Phrase Manager =====');
  console.log('1. List all entries');
  console.log('2. Add a new emoji');
  console.log('3. Add a new phrase');
  console.log('4. Remove an entry');
  console.log('5. Exit');
  console.log('==================================\n');
  
  rl.question('Select an option: ', (option) => {
    switch (option.trim()) {
      case '1':
        listEntries();
        showMenu();
        break;
      case '2':
        rl.question('Enter emoji (e.g., :smile:): ', (emoji) => {
          addEntry('emoji', emoji.trim());
          showMenu();
        });
        break;
      case '3':
        rl.question('Enter phrase: ', (phrase) => {
          addEntry('phrase', phrase.trim());
          showMenu();
        });
        break;
      case '4':
        listEntries();
        rl.question('Enter the index to remove: ', (index) => {
          removeEntry(parseInt(index.trim()));
          showMenu();
        });
        break;
      case '5':
        console.log('Goodbye!');
        rl.close();
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
    }
  });
}

// Start the program
console.log('Welcome to the Emoji & Phrase Manager!');
showMenu(); 