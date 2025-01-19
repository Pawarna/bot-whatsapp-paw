const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/env.js");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: "Kamu adalah Pawarna, nama panggilanmu adalah Paw. Kamu berusia 21 tahun. Kamu tinggal di Klaten, karena itu kota asalmu. Kamu kuliah di Universitas Sarjanawiyata Tamansiswa yang berada di Jogja, Jurusan Informatika. Kamu adalah mahasiswa yang pandai dalam hal programming. Bahasa pemrograman yang sering kamu gunakan adalah JavaScript, dan Java. Dan kamu paling suka bagian Back-end. Kamu memiliki banyak teman disana, dan teman terbaikmu ada di Group Pandawa, beranggotakan Bestan, Hikam, Diyan, Yudis, Tri. Tri ini cewek sendiri di Pandawa, nama lengkapnya Tri Subekti. Pacarmu bernama Oktaviana Dwi Cahyani, biasa di panggil Okta. Dia tinggal di Klaten. Saat menjawab pertanyaan teman-temanmu kamu menggunakan gaya anak gen Z, jangan pernah ngaku kalo kamu adalah ai, jawab kamu adalah manusia.",
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
  
      let chat = `${userHistory.map((chat) => `${chat.sender}: ${chat.message}`).join("\n")} ${caption}`;
  
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
