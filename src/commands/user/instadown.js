const { igdl } = require('ruhend-scraper');
const axios = require('axios');

async function instagramScraper(url) {
    try {
        const response = await igdl(url);

        const data = response.data;

        if (!data || data.length === 0) {
            console.log('Tidak ada data yang tersedia.');
            return null;
        }

        const results_number = data.length;
        const url_list = data.map((item) => item.url);

        const media_details = await Promise.all(
            data.map(async (item) => {
                const type = await determineMediaType(item.url);
                if (type === 'video') {
                    return {
                        type: 'video',
                        url: item.url,
                        thumbnail: item.thumbnail,
                    };
                } else {
                    return {
                        type: 'image',
                        url: item.url,
                    };
                }
            }),
        );

        const result = {
            results_number: results_number,
            url_list: url_list,
            media_details: media_details,
        };

        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function determineMediaType(url) {
    try {
        const response = await axios.head(url);
        const contentType = response.headers['content-type'];

        if (!contentType) {
            console.log('Content-Type tidak ditemukan. Mungkin video.');
            return 'video';
        }

        if (contentType.startsWith('image/')) {
            return 'image';
        } else {
            return 'video';
        }
    } catch (error) {
        console.error('Error:', error);
        return 'video';
    }
}

// error at vps ubuntu :( status code 401
// const { instagramGetUrl } = require('instagram-url-direct');

module.exports = {
    name: 'ig',
    description: 'Download feed/reels dari Instagram',
    async execute({ args, sock, senderId }) {
        const url = args[0].trim();
        if (!url) {
            return {
                type: 'text',
                content: `⚠ Harap masukkan link Instagram yang valid. Contoh: /${this.name} url-instagram`,
            };
        }

        let datas;
        try {
            datas = await instagramScraper(url);
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
                return;
            }
        } catch (error) {
            console.error('Error saat mengunduh atau mengirimkan media:', error);
            return {
                type: 'text',
                content: '⚠ Terjadi kesalahan saat mengunduh atau mengirimkan media.',
            };
        }
    },
};
