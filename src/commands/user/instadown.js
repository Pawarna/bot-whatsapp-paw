const instagramGetUrl = require("instagram-url-direct");
const axios = require("axios");

module.exports = {
  name: "instadown",
  description: "Download feed/reels dari Instagram",
  execute: async ({ args, sock, senderId }) => {
    // Validasi input URL
    const url = args[0];
    if (!url) {
      return {
        type: "text",
        content: "⚠️ Harap masukkan link Instagram yang valid. Contoh: /instadown url-instagram"
      };
    }

    try {
      // Mengambil data dari Instagram menggunakan modul instagram-url-direct
      const datas = await instagramGetUrl(url);
      
      // Pastikan data post dan media tersedia
      if (!datas || !datas.media_details || datas.media_details.length === 0) {
        return {
          type: "text",
          content: "⚠️ Gagal menemukan media pada postingan Instagram. Pastikan link yang diberikan benar dan postingan bersifat publik."
        };
      }

      // Informasi proses download
      await sock.sendMessage(senderId, {
        text: "🔄 Sedang mengunduh media dari postingan Instagram..."
      });

      // Mengunduh tiap media (foto/video)
      for (let data of datas.media_details) {
        // Validasi tipe media yang didukung (misal: image atau video)
        if (!["image", "video"].includes(data.type)) {
          await sock.sendMessage(senderId, {
            text: `⚠️ Tipe media "${data.type}" tidak didukung.`
          });
          continue;
        }

        try {
          const response = await axios.get(data.url, { responseType: "arraybuffer" });
          const buffer = Buffer.from(response.data, "binary");
          // Mengirim media ke user
          await sock.sendMessage(senderId, { [data.type]: buffer });
        } catch (err) {
          console.error("Error saat mengunduh media:", err);
          await sock.sendMessage(senderId, {
            text: "⚠️ Terjadi kesalahan saat mengunduh salah satu media."
          });
        }
      }

      
      return {
        type: "text",
        content: `*${datas.post_info.owner_username}*\n\n${datas.post_info.caption}`
      };
    } catch (error) {
      console.error("Error saat memproses URL Instagram:", error);
      return {
        type: "text",
        content: "⚠️ Terjadi kesalahan saat memproses link Instagram. Pastikan link tersebut valid dan postingan bersifat publik."
      };
    }
  }
};
