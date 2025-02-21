const { resetChatHistory } = require('../../database/chatHistory.js');

module.exports = {
    name: 'new-chat',
    description: 'Mereset percakapan dengan @paww-bot',
    async execute({ sock, senderId }) {
        try {
            await resetChatHistory(senderId);

            await sock.sendMessage(senderId, { text: '🎉 *Sip! Obrolan kita udah Paw reset nih!* 😎 *Yuk, mulai chat baru lagi dengan ketik "paw"!* 😉' });
        } catch (error) {
            await sock.sendMessage(senderId, { text: '⚠ *Waduh, ada masalah nih!* 🥺 *Paw gagal reset chat kamu. Coba lagi nanti ya!* 🙏' });
        }
    },
};
