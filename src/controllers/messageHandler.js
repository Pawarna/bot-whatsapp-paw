const { loadActiveUser, saveActiveUser } = require('../utils/activeUserUtils.js');
const { commandRouter } = require('../routes.js');
const { geminiRequest } = require('../services/geminiService.js');
const { logger } = require('../utils/logger.js');
const { saveMessageToDb } = require('../database/chatHistory.js');
const analyzeImage = require('../services/imageService.js')

const activeDuration = 5 * 60 * 1000;


const handleIncomingMessage = async (message) => {
    try {
        const { conversation, imageBuffer } = message.message;
        const userId = message.userId;
        const sock = message.sock;
        const userHistory = message.userHistory;
        
        // Check if message is a command
        if (conversation && conversation.startsWith('/')) {
            logger(`Menjalankan command untuk user ${userId}: ${conversation}`);
            return await commandRouter(conversation);
        }

        const userData = await loadActiveUser(userId);

        // Check if user is active
        if (userData && userData.isActive) {
            if (Date.now() - userData.lastActive > activeDuration) {
                userData.isActive = false;
                await saveActiveUser(userId, userData);
                return null; // Or return a bot inactive message
            }

          const updatedUserData = {
              ...userData,
              lastActive: Date.now(),
          };

          await saveActiveUser(userId, updatedUserData);
          if(imageBuffer){
             await saveMessageToDb(userId, 'user', "pesan berupa gambar");
             const reply = await analyzeImage(imageBuffer, conversation ? conversation : "ini gambar", userHistory);
             await saveMessageToDb(userId, 'model', reply);
              return reply;
           }

          logger(`Balas pesan ke ${userId}: ${conversation}`);
          await saveMessageToDb(userId, 'user', conversation);

            const reply = await geminiRequest(conversation, userHistory);
            await saveMessageToDb(userId, 'model', reply);
          
          return reply
        }

        // Check if bot needs activation
        if (conversation && conversation.toLowerCase().includes("paw")) {
            logger(`User ${userId} memanggil paw, mengaktifkan bot`);

            const newUserData = {
                isActive: true,
                lastActive: Date.now(),
            };

            await saveActiveUser(userId, newUserData);
            await saveMessageToDb(userId, 'user', conversation);

          if(imageBuffer){
            await saveMessageToDb(userId, 'user', "pesan berupa gambar");
             const reply = await analyzeImage(imageBuffer, conversation ? conversation : "ini gambar", userHistory);
             await saveMessageToDb(userId, 'model', reply);
             return reply;
           }

            const reply = await geminiRequest(conversation, userHistory);
            await saveMessageToDb(userId, 'model', reply);
            return reply;
        }

        return null;
    } catch (err) {
        console.error("Error handling message:", err.message);
        return "Maaf, Bot lagi error";
    }
};

module.exports = { handleIncomingMessage };
