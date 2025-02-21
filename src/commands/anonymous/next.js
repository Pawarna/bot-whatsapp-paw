const anonymousService = require('../../services/anonymousService');
const { validatePrivateChat } = require('../../utils/anonymousHelper');

module.exports = {
  name: 'skip',
  aliases: ['next'],
  description: 'Skip pasangan saat ini dan cari pasangan baru.',
  execute: async ({ args, sock, senderId }) => {
    // Validasi: hanya bisa digunakan di chat pribadi
    if (!validatePrivateChat(senderId)) {
      return {
        type: 'text',
        content: '⚠️ Command ini hanya dapat digunakan di Chat Pribadi.',
      };
    }
    
    // Validasi: cek apakah user sedang dalam sesi anonymous chat
    const isActive = await anonymousService.isInChat(senderId);
    if (!isActive) {
      return {
        type: 'text',
        content: '⚠️ Kamu tidak sedang berada dalam sesi chat anonymous. Gunakan /anonym untuk memulai sesi anonymous chat.',
      };
    }
    
    // Keluar dari pasangan saat ini dengan mencatat cooldown
    await anonymousService.exitChat(senderId, sock, { recordCooldown: true });
    
    // Jika ada filter tambahan, gunakan (gender dan topic)
    let gender = null;
    let topic = null;
    if (args && args.length >= 2) {
      gender = args[0].toLowerCase();
      if (gender !== 'male' && gender !== 'female') {
        return {
          type: 'text',
          content: '⚠️ Gender hanya 2: male / female. Harap masukkan gender yang benar!',
        };
      }
      topic = args.slice(1).join(' ') || null;
    }
    
    await anonymousService.startChat(senderId, sock, { gender, topic });
    return;
  },
};
