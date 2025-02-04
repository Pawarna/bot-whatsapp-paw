const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'help',
  description: 'Menampilkan daftar command yang tersedia.',
  execute: async () => {
    const commands = [...loadCommands().values()];
    const commandList = commands
      .map((cmd) => `- */${cmd.name}*: ${cmd.description}`)
      .join('\n');
    return {
      type : 'text',
      content : `📖 *Daftar Command Pawarna Bot:* \n\n- *Ketik "paw"*: untuk chatingan menggunakan Chat-bot\n${commandList}`
    };
  },
};
