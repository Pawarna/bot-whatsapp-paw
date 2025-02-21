const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

module.exports = {
    name: 'sticker',
    description: 'Konversi gambar atau GIF menjadi stiker. Opsional gunakan flag -rmbg untuk remove backgroud',
    async execute({ media, sock, senderId, senderName }) {
        try {
            const { mediaBuffer, messageType, messageCaption } = media;

            if (!mediaBuffer) {
                await sock.sendMessage(senderId, { text: `⚠️ Harap kirimkan gambar/GIF dengan caption \`/${this.name}\`` });
                return;
            }

            const isRemoveBg = messageCaption?.toLowerCase().includes('-rmbg'); // Cek apakah ada flag -rmbg
            const isAnimated = messageType.startsWith('video/mp4'); // Cek apakah media adalah GIF

            if (!mediaBuffer || (!messageType.startsWith('image/') && !isAnimated)) {
                return await sock.sendMessage(senderId, { text: 'Maaf, command ini hanya bisa digunakan untuk gambar atau GIF.' });
            }

            let processedBuffer = mediaBuffer; // Buffer media yang akan diproses

            if (isRemoveBg && !isAnimated) {
                // Remove background hanya untuk gambar, bukan GIF
                // Proses remove background
                try {
                    const url = 'https://api.zpi.my.id/v1/utility/bg-remover/image'; // URL API remove background
                    const formData = new FormData();

                    // Kalo mediaBuffer udah dalam bentuk buffer
                    formData.append('file', mediaBuffer, {
                        filename: `image.${messageType.split('/')[1]}`, // Atau nama file yang sesuai
                        contentType: messageType, // Atau content type yang sesuai
                    });

                    const response = await axios.post(url, formData, {
                        headers: formData.getHeaders(), // Tambahin () di getHeaders
                    });

                    const buffered = await axios.get(response.data.data.bg_removed, {responseType: 'arraybuffer'})

                    processedBuffer = Buffer.from(buffered.data); // Ganti buffer media dengan hasil remove background
                } catch (error) {
                    console.error('Error remove background:', error);
                    return await sock.sendMessage(senderId, { text: 'Maaf, gagal menghapus background. Coba lagi nanti ya!' });
                }
            }

            const stickerOptions = {
                pack: 'created by ' + senderName, // Ganti dengan nama pack yang diinginkan
                author: `@paww-bot • ${sock.user.id.split(':')[0]}`, // Ganti dengan nama author yang diinginkan
                quality: 50, // Kualitas sticker (default 50)
            };

            if (isAnimated) {
                stickerOptions.type = StickerTypes.FULL;
                stickerOptions.animated = true;
            } else {
                stickerOptions.type = isRemoveBg? StickerTypes.CROPPED : StickerTypes.FULL; // Opsi: 'full' atau 'crop'
            }

            const sticker = new Sticker(processedBuffer, stickerOptions);

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(senderId, { sticker: stickerBuffer });
        } catch (error) {
            console.error('Error membuat stiker:', error);
            await sock.sendMessage(senderId, { text: 'Maaf, terjadi kesalahan saat membuat stiker.' });
        }
    },
};
