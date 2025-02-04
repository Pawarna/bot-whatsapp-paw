module.exports = {
    name: "fess",
    description: "Mengirimkan fess ke orang lain menggunakan nomor bot",
    execute: async ({args, sock}) => {
        if (!args) {
            return {
              type: 'text',
              content: '⚠️ *Format perintah salah*, gunakan format seperti ini: `/fess nomor pesan`'
            };
        }

        const stringArgs = args.join(' '); // Gabung array jadi string
        const trimmedArgs = stringArgs.trim(); // Trim string
  
        const result = trimmedArgs.match(/^(\+?\d+)\s+(.*)$/);
        
        let phoneNumber = null;
        let message = null

        if (!result){
            return {
                type: 'text',
                content: '⚠️*Format perintah salah*, gunakan format seperti ini: `/fess nomor pesan`'
            }
        }

        phoneNumber = result[1];
        message = result[2];

        // Menghilangkan tanda strip dari nomor telepon
        phoneNumber = phoneNumber.replace(/[-]/g, '');
        // Menghilangkan tanda + dari nomor telepon
        phoneNumber = phoneNumber.replace(/\+/g, '');


        if (!phoneNumber || !/^\d+$/.test(phoneNumber)){
            return {
                type: 'text',
                content: '⚠️*Nomor telepon tidak valid*. Pastikan nomor hanya berisi angka'
            }
        }

        if (!message){
            return {
                type: 'text',
                content: '⚠️*Pesan tidak boleh kosong*, silakan masukkan pesan yang ingin dikirim'
            }
        }

       if (phoneNumber.startsWith('0')){
            phoneNumber = "62" + phoneNumber.substring(1)
        }
        
        phoneNumber = phoneNumber + "@s.whatsapp.net";
        const fessMessage = `[FESS]\n\nDari: *Anonim*\n*Pesan*: ${message}\n\n-- Bot Fess --`;



        try {
            await sock.sendMessage(phoneNumber, {text: fessMessage})
            return {
                type: 'text',
                content: '*Fess berhasil terkirim*, semoga doi peka ya! 😉'
            }
        } catch (error) {
            return {
                type: 'text',
                content: '⚠️*Gagal mengirimkan pesan*, mungkin ada masalah jaringan atau nomor tidak terdaftar. Silakan coba lagi nanti ya'
            }
        }
    }
}
