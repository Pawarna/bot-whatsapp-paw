const fs = require('fs');
const path = require('path');

const loadCommands = (dir = path.join(__dirname, '../commands')) => {
    const commands = new Map();
    const categorizedCommands = {}; // Untuk menyimpan command berdasarkan kategori (folder)

    const readCommands = (directory, category = '') => {
        const files = fs.readdirSync(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                readCommands(fullPath, file); // Rekursif untuk subfolder, file jadi kategori
            } else if (file.endsWith('.js')) {
                try {
                    const command = require(fullPath);
                    if (command.name && typeof command.execute === 'function') {
                        commands.set(command.name.toLowerCase(), command);

                        if (!categorizedCommands[category]) {
                            categorizedCommands[category] = new Map();
                        }
                        categorizedCommands[category].set(command.name.toLowerCase(), command);
                    } else {
                        console.warn(`Command di file ${file} tidak valid.`);
                    }
                } catch (error) {
                    console.error(`Gagal memuat command di file ${file}:`, error);
                }
            }
        }
    };

    readCommands(dir);
    return { commands, categorizedCommands };
};

module.exports = { loadCommands };
