// commands/anonymous/anonymous.js
const anonymousService = require('../../services/anonymousService');
const { buildStatsMessage, validatePrivateChat } = require('../../utils/anonymousHelper');

module.exports = {
  name: 'anonym',
  description: 'Masuk ke mode chat anonymous. Opsional: masukkan gender dan topic. Contoh: /anonym male gaming',
  execute: async ({ args, sock, senderId }) => {
    // Validasi: hanya bisa di chat pribadi
    if (!validatePrivateChat(senderId)) {
      return {
        type: 'text',
        content: '⚠️ Command ini hanya dapat digunakan di Chat Pribadi.',
      };
    }

    // Jika argumen diberikan, gunakan sebagai filter (gender dan topic)
    if (args && args.length > 0) {
      const gender = args[0].toLowerCase();
      if (gender !== 'male' && gender !== 'female') {
        return {
          type: 'text',
          content: '⚠️ Gender hanya 2: male / female. Harap masukkan gender yang benar!',
        };
      }
      const topic = args.slice(1).join(' ') || null;
      await sock.sendMessage(senderId, {
        text: `🔒 Kamu telah masuk ke mode chat anonim dengan filter:\n• Gender: ${gender}\n• Topic: ${topic || 'tidak ditentukan'}\n\n${await buildStatsMessage()}\n\n*Tips Penggunaan:*\n• Gunakan /exit untuk keluar\n• Gunakan /skip untuk mencari pasangan baru`,
      });
      await anonymousService.startChat(senderId, sock, { gender, topic });
      return;
    }

    // Jika tidak ada argumen, masuk ke mode anonim tanpa filter
    await sock.sendMessage(senderId, {
      text: `🔒 Kamu telah masuk ke mode chat anonim.\n\n${await buildStatsMessage()}\n*Tips Penggunaan:*\n• /anonym <gender> <topic> → cari pasangan dengan filter\n• /exit → keluar\n• /skip → cari pasangan baru`,
    });
    await anonymousService.startChat(senderId, sock);
  },
};
