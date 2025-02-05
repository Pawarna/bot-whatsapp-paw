const { downloadTiktok } = require('@mrnima/tiktok-downloader');
const { default: axios } = require('axios');
const { logger } = require('../../utils/logger');

module.exports = {
    name: 'tikdown',
    description: 'Download video/foto dari Tiktok. Tambahkan flag -hd untuk download video HD',
    execute: async ({args, senderId, sock}) => {
        url = args.find(arg => !arg.startsWith("-"));
        const isHD = args.includes("-hd");

        if (!url) {
            return {
                type: "text",
                content: "⚠ Harap masukkan link TikTok yang valid. Contoh : /tikdown url-tiktok"
            };
        }

        try {
            const vt = await downloadTiktok(url);
            if (!vt) {
                return {
                    type: 'text',
                    content: '⚠ Gagal menemukan media pada postingan Tiktok. Pastikan link yang diberikan benar dan postingan bersifat publik.'
                }
            }

            await sock.sendMessage(senderId, {
                text: "🔄 Sedang mengunduh media dari postingan Tiktok..."
            });

            // Bagian untuk mengirim gambar (tidak diubah, karena sudah efisien)
            if (vt.result.dl_link.images){
                for (const image of vt.result.dl_link.images) {
                    try {
                        const response = await axios.get(image, { responseType: "arraybuffer" });
                        const buffer = Buffer.from(response.data, "binary");
                        console.log(buffer);
                        await sock.sendMessage(senderId, { image : buffer})
                        
                    } catch (error) {
                        logger.error("Error saat mengunduh media:", error);
                        await sock.sendMessage(senderId, {
                          text: "⚠ Terjadi kesalahan saat mengunduh salah satu media."
                        });
                    }

                }

            }

            // Bagian untuk mengirim video (DIUBAH MENGGUNAKAN STREAM)
            try {
                if (vt.result.dl_link.download_mp4_1){
                    let videoUrl = isHD ? vt.result.dl_link.download_mp4_hd : vt.result.dl_link.download_mp4_1;
                    if (!videoUrl) {
                        return {
                            type: 'text',
                            content: '⚠ Video HD tidak tersedia.'
                        };
                    }

                    const response = await axios({
                        method: 'GET',
                        url: videoUrl,
                        responseType: 'stream'
                    });

                    return { 
                        type: 'video',
                        content: response.data,
                        caption: `${vt.result.title}`
                    };
                }

                
            } catch (error) {
                logger.error("Error saat mengunduh media:", error);
                await sock.sendMessage(senderId, { text: "⚠ Terjadi kesalahan saat mengunduh salah satu media." });
            }
            
        return { 
            type: 'text',
            content: `${vt.result.title}`
        }
            
        } catch (error) {
            logger.error("Error saat memproses URL Tiktok:", error);
            return {
                type: "text",
                content: "⚠ Terjadi kesalahan saat memproses link Tiktok. Pastikan link tersebut valid dan postingan bersifat publik."
            };
        }

    


    }
}
