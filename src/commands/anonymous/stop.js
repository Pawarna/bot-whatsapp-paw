// commands/anonymous/exit.js
const anonymousService = require('../../services/anonymousService');
const { validatePrivateChat } = require('../../utils/anonymousHelper');

module.exports = {
  name: 'exit',
  aliases: ['stop'], // alias: /stop
  description: 'Keluar dari mode chat anonymous.',
  execute: async ({ args, sock, senderId }) => {
    if (!validatePrivateChat(senderId)) {
      return {
        type: 'text',
        content: '⚠️ Command ini hanya dapat digunakan di Chat Pribadi.',
      };
    }

    const isActive = await anonymousService.isInChat(senderId);
        if (!isActive) {
          return {
            type: 'text',
            content: '⚠️ Kamu tidak sedang berada dalam sesi chat anonymous. Gunakan /anonym untuk memulai sesi anonymous chat.',
          };
        }

    await anonymousService.exitChat(senderId, sock);
    return
  },
};
