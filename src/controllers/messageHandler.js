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
    const { conversation, senderId, sock, chatHistory } = message;
    const { mediaBuffer, messageType, messageCaption } = message.media;

    if (conversation && conversation.startsWith("/")) {
      logger(`Menjalankan command untuk user ${senderId}: ${conversation}`);
      return await commandRouter(conversation);
    }

    let userData = await loadActiveUser(senderId);
    
    // Cek Inaktif diawal
    if(userData && userData.isActive) {
      if (Date.now() - userData.lastActive > activeDuration) {
        userData.isActive = false;
        await saveActiveUser(senderId, userData);
        userData = null; // Reset userData supaya masuk ke logika aktivasi
      }
    }

    // Cek User aktif
    if (userData && userData.isActive) {
      const updatedUserData = {
        ...userData,
        lastActive: Date.now(),
      };

      await saveActiveUser(senderId, updatedUserData);

      if (mediaBuffer) {
        await saveMessageToDb(
          senderId,
          "user",
          `Pesan berupa file : ${messageType}, dengan caption :${messageCaption}`
        );
        const replyMessage = await analyzeFile(mediaBuffer, messageType, messageCaption, chatHistory);
        await saveMessageToDb(senderId, "model", replyMessage);
        return replyMessage;
      }
      if (conversation) {
        logger(`Balas pesan ke ${senderId}: ${conversation}`);
        await saveMessageToDb(senderId, "user", conversation);

        const replyMessage = await geminiRequest(conversation, chatHistory);
        await saveMessageToDb(senderId, "model", replyMessage);
        return replyMessage;
      }
    }

    // Cek jika bot perlu aktivasi
    if (conversation && conversation.toLowerCase().includes("paw")) {
      logger(`User ${senderId} memanggil paw, mengaktifkan bot`);

      const newUserData = {
        isActive: true,
        lastActive: Date.now(),
      };
      await saveActiveUser(senderId, newUserData);
      await saveMessageToDb(senderId, "user", conversation);


      if (mediaBuffer) {
         await saveMessageToDb(
            senderId,
            "user",
            `Pesan berupa file : ${messageType}, dengan caption :${messageCaption}`
          );
        const replyMessage = await analyzeFile(mediaBuffer, messageType, messageCaption, chatHistory);
        await saveMessageToDb(senderId, "model", replyMessage);
        return replyMessage;
      }
       const replyMessage = await geminiRequest(conversation, chatHistory);
        await saveMessageToDb(senderId, "model", replyMessage);
      return replyMessage;
    }

    return null;
  } catch (err) {
    console.error("Error handling message:", err.message);
    return "Maaf, Bot lagi error";
  }
};



module.exports = { handleIncomingMessage };
