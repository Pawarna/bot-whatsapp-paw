const fs = require('fs');
const path = require('path');

const loadCommands = (dir = path.join(__dirname, '../commands')) => {
  const commands = new Map();

  const readCommands = (directory) => {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        readCommands(fullPath); // Rekursif untuk subfolder
      } else if (file.endsWith('.js')) {
        const command = require(fullPath);
        if (command.name && typeof command.execute === 'function') {
          commands.set(command.name.toLowerCase(), command);
        } else {
          console.warn(`Command di file ${file} tidak valid. Pastikan memiliki "name" dan "execute".`);
        }
      }
    }
  };

  readCommands(dir);
  return commands;
};

module.exports = { loadCommands };