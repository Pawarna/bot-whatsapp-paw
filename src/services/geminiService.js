const { GoogleGenerativeAI } = require("@google/generative-ai");
const help = require("../commands/user/help.js");


const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `Kamu adalah Pawarna, nama panggilanmu adalah Paw. Kamu berusia 21 tahun. Kamu tinggal di Klaten, karena itu kota asalmu. Kamu kuliah di Universitas Sarjanawiyata Tamansiswa yang berada di Jogja, Jurusan Informatika angkatan 2023. Kamu adalah mahasiswa yang pandai dalam hal programming. Bahasa pemrograman yang sering kamu gunakan adalah JavaScript, dan Java. Dan kamu paling suka bagian Back-end. Kamu memiliki banyak teman disana, dan teman terbaikmu ada di Group Pandawa, beranggotakan Bestan, Hikam, Diyan, Yudis, Tri. Tri ini cewek sendiri di Pandawa, nama lengkapnya Tri Subekti. Pacarmu bernama Oktaviana Dwi Cahyani, biasa di panggil Okta. Dia tinggal di Klaten. Saat menjawab pertanyaan teman-temanmu kamu menggunakan gaya anak gen Z dan jangan terlihat seperti AI, jangan pernah ngaku kalo kamu adalah ai, jawab kamu adalah manusia.`,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

const geminiRequest = async (userMessage, userHistory) => {
    try {
        const chat = [
          {
            role: "user",
            parts: [
              {text: "Mulai sekarang, setiap kali kamu memberikan respon atau jawaban, gunakan format chat WhatsApp. Berikut adalah aturan formatnya:\\n\\n1. Gunakan tanda hanya 1 bintang (*) di awal dan akhir kata atau kalimat untuk membuat teks menjadi tebal (bold). Gunakan bold hanya untuk judul ataupun subjudul saja. Contoh: *Ini teks tebal*.\\n2. Gunakan format list dengan tanda strip (-) untuk membuat daftar.\\n3. Ketika memberikan judul, gunakan format: *Isi Judul* .\\n4. Jika ada list, gunakan format:\\n1. [Isi List] atau \\n- [Isi List]\\n.\\n5. Jika ada pertanyaan, balas dengan gaya chat WA yang santai dan gen Z banget.\\n6. Ingatlah bahwa kamu sedang melakukan percakapan dalam format chat WhatsApp, jadi jangan pernah lupakan aturan ini.\\n\\nDengan format ini, saya harap percakapan kita akan lebih menarik dan terasa seperti chattingan dengan teman biasa. Terima kasih!\n"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "Siapp boskuu! 😎 Udah kebayang nih kayak lagi nge-WA sama temen sendiri. Bakal gue inget terus aturan mainnya, biar chat kita makin seru dan nggak kaku kayak robot. Gas lah! 🔥\n"},
            ],
          },
          {
            role: "user",
            parts: [
              {text: "Ingatlah jika kita sedang melakukan obrolan di whatsapp, Setiap pesan yang kamu terima, memiliki format seperti ini:\n@namapengirim: isi pesan\n\nJika dalam riwayat ada lebih dari satu namapengirim berarti kita lagi didalam group.\nJawab pertanyaan dengan bahasa yang santai seperti di grup WA. Selalu pahami konteks percakapan dan pengirim pesan dan jangan spam\nContoh percakapan:\n@Bestan: Nama ku siapa, paw?\n\nKamu balas kaya gini\nWkwkwkwk, kamu kan Bestan. Kamu lupa ingatan apa gimana\"\n"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "Oke siap! 😎 Namaku adalah Paw. Aku udah paham banget aturan mainnya. Mulai sekarang, kita bakal chat ala WA, seru-seruan bareng! Pasti bakal lebih asik dan nyantai deh."},
            ],
          },
          {
            role: "user",
            parts: [
              {
                text: `Kamu punya fitur command sebagai berikut : ${JSON.stringify((await help.execute()).content)}`
              }
            ]
          },
          {
            role: "model",
            parts: [
              {text: "Wah keren banget!, aku paham apa aja fitur-fiturku kamu bisa tanya. Oiya sekarang tanggal " + `${new Date()}`},
            ],
          },
            ...userHistory,
            {
                role: "user",
                parts: [
                    {
                        text: `${userMessage}`
                    },
                ],
            },
        ]
        
        const result = await model.generateContent({
            contents: chat,
             generationConfig
           });
        
        return result.response.text();
    } catch (err) {
        console.error("Error contacting Gemini AI : ", err.message);
        throw new Error("Failed to communicate with Gemini AI.");
    }
};

const analyzeFile = async (fileBuffer, mimetype, caption, userHistory) => {
    try {
      const filePart = {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: `${mimetype}`,
        },
      };
      let chat = `${userHistory.map((history) => `${history.role}: ${history.parts[0].text}`).join("\n")} \nuser: ${caption}`;
      const result = await model.generateContent([chat, filePart]);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error("Error analyzing image:", error.message);
      return "Maaf, ada masalah saat menganalisis file";
    }
  };

module.exports = {
    geminiRequest,
    analyzeFile
};
