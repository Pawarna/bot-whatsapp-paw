const {
  loadActiveUser,
  saveActiveUser,
} = require("../utils/activeUserUtils.js");
const { commandRouter } = require("../routes.js");
const { geminiRequest, analyzeFile } = require("../services/geminiService.js");
const { logger } = require("../utils/logger.js");
const { saveMessageToDb } = require("../database/chatHistory.js");
const activeDuration = 5 * 60 * 1000;

const handleIncomingMessage = async (message) => {
      try {
        const { conversation } = message.message;
        const { fileBuffer, mimetype, caption } = message.message.file;
        const userId = message.userId;
        const sock = message.sock;
        const userHistory = message.userHistory;

        if (conversation && conversation.startsWith("/")) {
          logger(`Menjalankan command untuk user ${userId}: ${conversation}`);
          return await commandRouter(conversation);
        }
        
        let userData = await loadActiveUser(userId);
        
        // Cek Inaktif diawal
         if(userData && userData.isActive) {
          if (Date.now() - userData.lastActive > activeDuration) {
            userData.isActive = false;
            await saveActiveUser(userId, userData);
            userData = null // Reset userData supaya masuk ke logika aktivasi
          }
        }
        
        // Cek User aktif
        if (userData && userData.isActive) {
          const updatedUserData = {
            ...userData,
            lastActive: Date.now(),
          };

          await saveActiveUser(userId, updatedUserData);

          if (fileBuffer) {
              await saveMessageToDb(
                userId,
                "user",
                `Pesan berupa file : ${mimetype}, dengan caption :${caption}`
              );
              const reply = await analyzeFile(fileBuffer, mimetype, caption, userHistory);
              await saveMessageToDb(userId, "model", reply);
              return reply;
            }
          if (conversation) {
            logger(`Balas pesan ke ${userId}: ${conversation}`);
            await saveMessageToDb(userId, "user", conversation);

            const reply = await geminiRequest(conversation, userHistory);
            await saveMessageToDb(userId, "model", reply);
            return reply;
          }
        }


        // Cek jika bot perlu aktivasi
          if (conversation && conversation.toLowerCase().includes("paw")) {
            logger(`User ${userId} memanggil paw, mengaktifkan bot`);

            const newUserData = {
                isActive: true,
                lastActive: Date.now(),
            };
            await saveActiveUser(userId, newUserData);
            await saveMessageToDb(userId, "user", conversation);


            if (fileBuffer) {
              await saveMessageToDb(
                userId,
                "user",
                `Pesan berupa file : ${mimetype}, dengan caption :${caption}`
              );
            const reply = await analyzeFile(fileBuffer, mimetype, caption, userHistory);
            await saveMessageToDb(userId, "model", reply);
            return reply
          }
            const reply = await geminiRequest(conversation, userHistory);
            await saveMessageToDb(userId, "model", reply);
            return reply;
          }


        return null;
      } catch (err) {
        console.error("Error handling message:", err.message);
        return "Maaf, Bot lagi error";
      }
    };


module.exports = { handleIncomingMessage };
