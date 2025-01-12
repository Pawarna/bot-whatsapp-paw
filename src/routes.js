const { loadCommands } = require('./utils/commandLoader');
const { getClosestCommand } = require('./utils/stringSimilarity');
const {logger} = require('./utils/logger.js')

// Memuat semua command
const commands = loadCommands();
logger('Command yang berhasil dimuat:', [...commands.keys()])

const commandRouter = async (message) => {
  // Memisahkan command dan argumen
  const [command, ...args] = message.trim().split(/\s+/);

  // Cek apakah command valid
  const commandKey = command.startsWith('/') ? command.slice(1).toLowerCase() : command.toLowerCase();
  if (commands.has(commandKey)) {
    // Jalankan command jika valid
    return await commands.get(commandKey).execute(args);
  }

  // Jika tidak valid, cari command yang mirip
  const closestCommand = getClosestCommand(commandKey, [...commands.keys()]);
  if (closestCommand) {
    return `⚠️ Mungkin maksud Anda: *${closestCommand}*? Ketik command tersebut untuk melanjutkan.`;
  }

  // Jika tidak ada yang cocok
  return '⚠️ Maaf, command tidak dikenali. Ketik */help* untuk melihat daftar command yang tersedia.';
};
module.exports = { commandRouter };
