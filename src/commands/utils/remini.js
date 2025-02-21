const remini = require('remini-cli');
const { logger } = require('../../utils/logger');

module.exports = {
    name: 'remini',
    description: 'Remini foto-foto kamu biar makin biar HD. Opsional gunakan argument "enhance", "recolor", "dehaze". Contoh : /remini enhance',
    execute: async ({ args, media, sock, senderId }) => {
        if (!media.mediaBuffer) {
            await sock.sendMessage(senderId, {
                text: '⚠ Harap lampirkan gambar untuk menggunakan command */remini* !',
            });
            return;
        }

        const fileBuffer = media.mediaBuffer;
        const model = args[0] || 'enhance'; // Ambil model dari args, default: enhance

        // Fungsi Validasi Model
        const isValidModel = (model) => {
            const allowedModels = ['enhance', 'recolor', 'dehaze'];
            return allowedModels.includes(model);
        };

        if (!isValidModel(model)) {
            await sock.sendMessage(senderId, {
                text: '❌ Model tidak valid. Gunakan: enhance, recolor, atau dehaze',
            });
            return;
        }

        try {
            const result = await remini(fileBuffer, model); // Gunakan model dari args
            await sock.sendMessage(senderId, { image: result });
        } catch (error) {
            logger.error('Gagal mengenchant gambar dari user : ' + senderId);
            await sock.sendMessage(senderId, {
                text: '❌ Waduh gambar gagal di remini nih. Coba lagi nanti ya',
            });
        }
    },
};
