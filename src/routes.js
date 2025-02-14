const { loadCommands } = require('./utils/commandLoader');
const { getClosestCommand } = require('./utils/stringSimilarity');
const {logger} = require('./utils/logger.js')

// Memuat semua command
const commands = loadCommands();
logger.info('Command yang berhasil dimuat: ' + [...commands.keys()])

const commandRouter = async (message) => {
  const { conversation, senderId, sock, media, senderName} = message;

  // Memisahkan command dan argumen
  const [command, ...args] = conversation.trim().split(/\s+/);
  
  // Cek apakah command valid
  //const commandKey = command.startsWith('/') ? command.slice(1).toLowerCase() : command.toLowerCase();
  const prefixes = ["/", ".", "!"];
  let commandKey = command.toLowerCase();
  for (const prefix of prefixes) {
    if (command.startsWith(prefix)) {
      commandKey = command.slice(1).toLowerCase();
      break;
    }
  }
  if (commands.has(commandKey)) {
    // Jalankan command jika valid
    return await commands.get(commandKey).execute({
      args,
      senderId,
      sock,
      media,
      senderName
    });
  }

  // Jika tidak valid, cari command yang mirip
  const closestCommand = getClosestCommand(commandKey, [...commands.keys()]);
  if (closestCommand) {
    return {
      type : 'text',
      content : `⚠ Mungkin maksud Anda: *${closestCommand}*? Ketik command tersebut untuk melanjutkan.`
    };
  }

  // Jika tidak ada yang cocok
  return {
    type: "text",
    content: '⚠ Maaf, command tidak dikenali. Ketik */help* untuk melihat daftar command yang tersedia.'
  };
};

module.exports = { commandRouter };
