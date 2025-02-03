const { downloadTiktok } = require('@mrnima/tiktok-downloader');
const { default: axios } = require('axios');

module.exports = {
    name: 'tikdown',
    description: 'Download video/foto dari Tiktok. Tambahkan flag -hd untuk download video HD',
    execute: async ({args, senderId, sock}) => {
        url = args.find(arg => !arg.startsWith("-"));
        const isHD = args.includes("-hd");

        if (!url) {
            return {
                type: "text",
                content: "⚠️ Harap masukkan link TikTok yang valid. Contoh : /tikdown url-tiktok"
            };
        }

        try {
            const vt = await downloadTiktok(url);
            if (!vt) {
                return {
                    type: 'text',
                    content: '⚠️ Gagal menemukan media pada postingan Tiktok. Pastikan link yang diberikan benar dan postingan bersifat publik.'
                }
            }

            await sock.sendMessage(senderId, {
                text: "🔄 Sedang mengunduh media dari postingan Tiktok..."
            });

            if (vt.result.dl_link.images){
                for (const image of vt.result.dl_link.images) {
                    try {
                        const response = await axios.get(image, { responseType: "arraybuffer" });
                        const buffer = Buffer.from(response.data, "binary");
                        console.log(buffer);
                        await sock.sendMessage(senderId, { image : buffer})
                        
                    } catch (error) {
                        console.error("Error saat mengunduh media:", err);
                        await sock.sendMessage(senderId, {
                          text: "⚠️ Terjadi kesalahan saat mengunduh salah satu media."
                        });
                    }

                }

            }

            try {
                if (vt.result.dl_link.download_mp4_1){
                    let response = null;
                    let buffer = null;

                    if (isHD){
                        response = await axios.get(vt.result.dl_link.download_mp4_hd, { responseType: "arraybuffer" });
                    } else {
                        response = await axios.get(vt.result.dl_link.download_mp4_1, { responseType: "arraybuffer" });
                    }

                    buffer = Buffer.from((await response).data, "binary");
                    console.log(buffer)
                    return {
                        type: 'video',
                        content: buffer,
                        caption: `${vt.result.title}`
                    }
                }

                
            } catch (error) {
                console.error("Error saat mengunduh media:", err);
                await sock.sendMessage(senderId, { text: "⚠️ Terjadi kesalahan saat mengunduh salah satu media." });
            }
            
        return {
            type: 'text',
            content: `${vt.result.title}`
        }
            
        } catch (error) {
            console.error("Error saat memproses URL Tiktok:", error);
            return {
                type: "text",
                content: "⚠️ Terjadi kesalahan saat memproses link Tiktok. Pastikan link tersebut valid dan postingan bersifat publik."
            };
        }

    


    }
}