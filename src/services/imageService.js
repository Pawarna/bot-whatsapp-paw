const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const analyzeImage = async (imageBuffer, caption, userHistory) => {
    try {
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      let prompt = `${userHistory.map(chat => `${chat.sender}: ${chat.message}`).join('\n')} ${caption}`;
    
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error analyzing image:", error.message);
        return "Maaf, ada masalah saat menganalisis gambar";
    }
};

module.exports = analyzeImage;
