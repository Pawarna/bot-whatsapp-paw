// commands/anonymous.js
const anonymousService = require('../../services/anonymousService');

module.exports = {
  name: 'anonym',
  description: 'Masuk/keluar dari mode chat anonymous. Opsional: masukkan gender dan topic.',
  execute: async ({ args, sock, senderId }) => {
    const sender = senderId

    if (sender.includes('@g.us')){
      return {
        type: 'text',
        content: '⚠️ Command */anonym* tidak bisa digunakan di Group, hanya Chat Pribadi.'
      }
    }

    // Perintah exit untuk keluar dari mode anonim
    if (args && args.length > 0 && args[0].toLowerCase() === 'exit') {
      await anonymousService.exitChat(sender, sock);
      return;
    }

    // Perintah next/skip: keluar dari pasangan saat ini dan cari pasangan baru,
    // dengan mencatat pasangan sebelumnya ke dalam cooldown.
    if (args && args.length > 0 && (args[0].toLowerCase() === 'next' || args[0].toLowerCase() === 'skip')) {
      await anonymousService.exitChat(sender, sock, { recordCooldown: true });
      // Jika ada parameter tambahan, anggap sebagai gender dan topic
      let gender = null, topic = null;
      if (args.length >= 3) {
        gender = args[1];
        topic = args.slice(2).join(' ');
      }
      // Panggil startChat tanpa mengembalikan respons tambahan, biarkan startChat yang mengirim notifikasi.
      await anonymousService.startChat(sender, sock, { gender, topic });
      return null;  // Tidak mengembalikan response tambahan
    }

    // Jika argumen diberikan (selain exit/next), anggap sebagai kriteria untuk gender dan topic.
    if (args && args.length > 0) {
      let gender = args[0];
      if (!gender.includes('male'||'female')){
        return {
          type: 'text',
          content: '⚠️ Gender hanya 2 : male / female. Harap masukkan gender yang benar!'
        }
      }
      let topic = args.slice(1).join(' ') || null;
      sock.sendMessage(sender, { text : `🔒 Kamu telah masuk ke mode chat anonim dengan filter:\n• Gender: ${gender}\n• Topic: ${topic || 'tidak ditentukan'}\n\nTunggu pasangan untuk mulai chat!\n\n*Tips Penggunaan:*\n• Gunakan /anonym exit untuk keluar\n• Gunakan /anonym next untuk skip pasangan`})
      await anonymousService.startChat(sender, sock, { gender, topic });
      return;
    }

    // Jika tidak ada argumen, masuk ke mode anonim tanpa kriteria tambahan.
    sock.sendMessage(sender, { text : '🔒 Kamu telah masuk ke mode chat anonim.\n\n*Tips Penggunaan:*\n• /anonym <gender> <topic> → cari pasangan dengan filter\n• /anonym exit → keluar\n• /anonym next → skip pasangan'})
    await anonymousService.startChat(sender, sock);
  },
};
