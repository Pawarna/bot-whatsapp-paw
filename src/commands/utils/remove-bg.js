const axios = require('axios');
const { logger } = require('../../utils/logger.js');
const FormData = require('form-data'); // Import FormData

module.exports = {
    name: 'removebg',
    aliases: ['remove-bg', 'remove.bg', 'rmbg'],
    description: 'Hapus latar belakang foto kamu',
    async execute({ media, sock, senderId }) {
        const { mediaBuffer, messageType, messageCaption } = media;

        if (!mediaBuffer || !messageType || !messageType.includes('image')) {
            await sock.sendMessage(senderId, { text: `⚠ Harap kirimkan gambar dengan caption \`/${module.exports.name}\`` });
            return;
        }

        const msg = await sock.sendMessage(senderId, { text: '⏳ Lagi diproses nih... Sabar ya! 😉' });
        try {
            const url = 'https://api.zpi.my.id/v1/utility/bg-remover/image'; // URL API remove background
            const formData = new FormData();

            formData.append('file', mediaBuffer, {
                filename: `image.${messageType.split('/')[1]}`, // Atau nama file yang sesuai
                contentType: messageType, // Atau content type yang sesuai
            });

            const response = await axios.post(url, formData, {
                headers: formData.getHeaders(), // Spread the headers object
            });

            const nobg = await axios.get(response.data.data.bg_removed, { responseType: 'stream' });

            // Kirim pesan sukses
            await sock.sendMessage(senderId, {
                image: { stream: nobg.data },
                caption: 'Taraaa! Background-nya udah ilang nih! ✨',
            });
        } catch (error) {
            logger.error('Command rmbg: ', error);
            await sock.sendMessage(senderId, {
                text: '⚠ Gagal remove bg. Coba lagi nanti ya! 🙏',
                edit: msg.key,
            });
        }
    },
};
