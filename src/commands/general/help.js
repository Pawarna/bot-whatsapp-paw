const { loadCommands } = require('../../utils/commandLoader');

// Panggil loadCommands sekali di awal

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar command yang tersedia.',
    async execute() {
        let commandList = '📖 *Daftar Command Pawarna Bot:* \n\n- *Ketik "paw"*: untuk chatting menggunakan Chat-bot\n';
        const { categorizedCommands } = await loadCommands();

        // Loop berdasarkan kategori (folder)
        for (const [category, commandMap] of Object.entries(categorizedCommands)) {
            commandList += `\n❗ *${category.toUpperCase()}*\n`;
            for (const cmd of commandMap.values()) {
                commandList += `- */${cmd.name}*: ${cmd.description}\n`;
            }
        }

        return {
            type: 'text',
            content: commandList,
        };
    },
};
