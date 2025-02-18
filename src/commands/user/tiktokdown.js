const Tiktok = require('@tobyg74/tiktok-api-dl');
const axios = require('axios');
const { logger } = require('../../utils/logger');

module.exports = {
    name: 'tt',
    description: 'Download video/photo tiktok. Opsional: Gunakan flag -m untuk download musicnya saja',
    async execute ({args, sock, senderId}) {
        const url = args.find(arg => !arg.startsWith("-"));
        const isMusic = args.includes('-m');

        if (!url) {
            await sock.sendMessage(senderId, { text: `⚠ Harap masukkan link TikTok yang valid. Contoh : /${this.name} url-tiktok` });
            return;
        }

        try {
            const vt = await Tiktok.Downloader(url, {
                version: "v2",
                proxy: "Https",
                showOriginalResponse: true
            });

            const headers = {
              'User-Agent': 'Mozilla/5.0',
              'Content-Type': 'application/json'
          };

            if (vt.status !== "success") {
                throw new Error("⚠ Gagal menemukan media pada postingan TikTok. Pastikan link yang diberikan benar dan postingan bersifat publik.");
            }

            // Membuat Caption
            const caption = `${vt?.result?.author?.nickname}\n\n${vt?.result?.desc}\n👍 ${vt?.result?.statistics?.likeCount} | 💬 ${vt?.result?.statistics?.commentCount} | *Share* ${vt?.result?.statistics?.shareCount}`;

            await sock.sendMessage(senderId, { text: "🔄 Sedang mengunduh media dari postingan TikTok..." });
            await sock.sendPresenceUpdate('composing', senderId)
            

            // Cek apakah hanya musik yang diunduh
            if (isMusic) {
                try {
                    const musicURL = vt.result?.music;
                    const response = await axios({
                        method: 'GET',
                        url: musicURL,
                        responseType: 'stream',
                        headers
                    });

                    await sock.sendMessage(senderId, { audio: { stream: response.data }, mimetype: 'audio/mp4' });
                } catch (err) {
                    logger.error("Gagal mengunduh musik TikTok: ", err);
                    await sock.sendMessage(senderId, { text: '⚠ Gagal mengunduh musik TikTok. Silakan coba lagi.' });
                }
                return;
            }

            // Jika video
            if (vt.result?.type === 'video') {
                try {
                    const videoURL = vt.result?.video;
                    const response = await axios({
                        method: 'GET',
                        url: videoURL,
                        responseType: 'stream',
                        headers
                    });

                    await sock.sendMessage(senderId, { video: { stream: response.data }, caption });
                } catch (err) {
                    logger.error("Gagal mengunduh video TikTok: ", err);
                    await sock.sendMessage(senderId, { text: '⚠ Gagal mengunduh video TikTok. Silakan coba lagi.' });
                }
                return;
            }

            // Jika gambar
            const imagesURL = vt.result?.images;

            if (imagesURL.length === 1) {
                try {
                    const response = await axios({
                        method: 'GET',
                        url: imagesURL[0],
                        responseType: 'stream',
                        headers
                    });

                    await sock.sendMessage(senderId, { image: { stream: response.data }, caption });
                } catch (err) {
                    logger.error("Gagal mengunduh gambar TikTok: ", err);
                    await sock.sendMessage(senderId, { text: '⚠ Gagal mengunduh gambar TikTok. Silakan coba lagi.' });
                }
                return;
            }

            // Jika banyak gambar
            for (const image of imagesURL) {
                try {
                    const response = await axios({
                        method: 'GET',
                        url: image,
                        responseType: 'stream',
                        headers
                    });

                    await sock.sendMessage(senderId, { image: { stream: response.data } });
                } catch (err) {
                    logger.error("Gagal mengunduh salah satu gambar TikTok: ", err);
                }
            }

            // Kirim caption terakhir setelah semua gambar
            await sock.sendMessage(senderId, { text: caption });

        } catch (error) {
            logger.error("Tikdown command fail: ", error);
            await sock.sendMessage(senderId, { text: '⚠ Maaf, server bot sedang error. Harap coba lagi' });
        }
    }
};
