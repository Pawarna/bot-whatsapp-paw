const { commandRouter } = require('../routes.js');
const {geminiRequest} = require('../services/geminiService.js');

const handleIncomingMessage = async (message) => {
    try {
        const {conversation} = message.message;

        if (conversation.startsWith('/')) {
            return await commandRouter(conversation);
          }

        return await geminiRequest(conversation); //Response dri Gemini AI
    }catch (err){
        console.error("Error handling message:", err.message);
        return "Maaf, Bot lagi error";
    }
};

module.exports = {handleIncomingMessage};
