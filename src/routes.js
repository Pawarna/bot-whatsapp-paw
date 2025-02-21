const { loadCommands } = require('./utils/commandLoader');
const { getClosestCommand } = require('./utils/stringSimilarity');
const { logger } = require('./utils/logger.js');

// Memuat semua command
const { commands } = loadCommands();
logger.info('Command yang berhasil dimuat: ' + [...commands.keys()]);

// Membuat aliasMap: memetakan alias ke command yang sama
const aliasMap = new Map();
for (const [cmdName, command] of commands.entries()) {
    if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
            aliasMap.set(alias.toLowerCase(), command);
        });
    }
}
logger.info('Alias yang terdaftar: ' + [...aliasMap.keys()]);

const commandRouter = async (message) => {
    const { conversation, senderId, sock, media, senderName } = message;

    // Memisahkan command dan argumen
    const [command, ...args] = conversation.trim().split(/\s+/);

    // Menangani prefix
    const prefixes = ['/', '.', '!'];
    let commandKey = command.toLowerCase();
    for (const prefix of prefixes) {
        if (command.startsWith(prefix)) {
            commandKey = command.slice(1).toLowerCase();
            break;
        }
    }

    let commandToExecute = null;

    // Cek apakah command valid di map utama
    if (commands.has(commandKey)) {
        commandToExecute = commands.get(commandKey);
    } 
    // Jika tidak, cek alias
    else if (aliasMap.has(commandKey)) {
        commandToExecute = aliasMap.get(commandKey);
    }

    if (commandToExecute) {
        return await commandToExecute.execute({
            args,
            senderId,
            sock,
            media,
            senderName,
        });
    }

    // Jika tidak valid, cari command yang mirip (termasuk alias)
    const allCommandKeys = [...commands.keys(), ...aliasMap.keys()];
    const closestCommand = getClosestCommand(commandKey, allCommandKeys);
    if (closestCommand) {
        return {
            type: 'text',
            content: `⚠ Mungkin maksud Anda: *${closestCommand}*? Ketik command tersebut untuk melanjutkan.`,
        };
    }

    // Jika tidak ada yang cocok
    return {
        type: 'text',
        content: '⚠ Maaf, command tidak dikenali. Ketik */help* untuk melihat daftar command yang tersedia.',
    };
};

module.exports = { commandRouter };
