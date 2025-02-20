const { instagramGetUrl } = require('instagram-url-direct');
const axios = require('axios');

module.exports = {
    name: 'ig',
    description: 'Download feed/reels dari Instagram',
    async execute({ args, sock, senderId }) {
        const url = args[0];
        if (!url) {
            return {
                type: 'text',
                content: `⚠ Harap masukkan link Instagram yang valid. Contoh: /${this.name} url-instagram`,
            };
        }

        let datas;
        try {
            datas = await instagramGetUrl(url);
            if (!datas || !datas.media_details || datas.media_details.length === 0) {
                return {
                    type: 'text',
                    content: '⚠ Gagal menemukan media pada postingan Instagram. Pastikan link yang diberikan benar dan postingan bersifat publik.',
                };
            }
        } catch (error) {
            console.error('Error saat mengambil data dari Instagram:', error);
            return {
                type: 'text',
                content: '⚠ Terjadi kesalahan saat mengambil data dari Instagram. Pastikan link tersebut valid dan postingan bersifat publik.',
            };
        }

        try {
            await sock.sendMessage(senderId, {
                text: '🔄 Sedang mengunduh media dari postingan Instagram...',
            });

            for (let data of datas.media_details) {
                if (!['image', 'video'].includes(data.type)) {
                    await sock.sendMessage(senderId, {
                        text: `⚠ Tipe media \"${data.type}\" tidak didukung.`,
                    });
                    continue;
                }

                try {
                    const response = await axios.get(data.url, { responseType: 'stream' });
                    await sock.sendMessage(senderId, { [data.type]: { stream: response.data } });
                } catch (err) {
                    console.error('Error saat mengunduh media:', err);
                    await sock.sendMessage(senderId, {
                        text: '⚠ Terjadi kesalahan saat mengunduh salah satu media.',
                    });
                }
            }

            return {
                type: 'text',
                content: `*${datas.post_info.owner_username}*\n\n${datas.post_info.caption}`,
            };
        } catch (error) {
            console.error('Error saat mengunduh atau mengirimkan media:', error);
            return {
                type: 'text',
                content: '⚠ Terjadi kesalahan saat mengunduh atau mengirimkan media.',
            };
        }
    },
};
