const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'help',
  description: 'Menampilkan daftar command yang tersedia.',
  execute: async () => {
    const commands = [...loadCommands().values()];
    const commandList = commands
      .map((cmd) => `- */${cmd.name}*: ${cmd.description}`)
      .join('\n');
    return `📖 *Daftar Command Pawarna Bot:*\n\n${commandList}`;
  },
};
