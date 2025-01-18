const { loadActiveUser, saveActiveUser } = require('../utils/activeUserUtils.js');
const { commandRouter } = require('../routes.js');
const { geminiRequest } = require('../services/geminiService.js');
const { logger } = require('../utils/logger.js');
const { saveMessageToDb, loadUserHistoryFromDb } = require('../database/chatHistory.js');

const activeDuration = 5 * 60 * 1000;

// Fungsi untuk handle command
const handleCommand = async (conversation, userId) => {
  logger(`Menjalankan command untuk user ${userId}: ${conversation}`);
  return await commandRouter(conversation);
};

// Fungsi untuk handle user aktif
const handleActiveUser = async (conversation, userId, userData, sock, userHistory) => {
  if (Date.now() - userData.lastActive > activeDuration) {
    userData.isActive = false;
    await saveActiveUser(userId, userData);
    return null; // Atau bisa kasih message bot tidak aktif
  }

  logger(`Balas pesan ke ${userId}: ${conversation}`);
  const updatedUserData = {
    ...userData,
    lastActive: Date.now(),
  };
  await saveActiveUser(userId, updatedUserData);
  await saveMessageToDb(userId, 'user', conversation);
  const reply = await geminiRequest(conversation, userHistory);
  await saveMessageToDb(userId, 'model', reply);
  return reply;
};

// Fungsi untuk aktifkan bot
const activateBot = async (conversation, userId, userHistory) => {
  logger(`User ${userId} memanggil paw, mengaktifkan bot`);
  const newUserData = {
    isActive: true,
    lastActive: Date.now(),
  };
  await saveActiveUser(userId, newUserData);
  await saveMessageToDb(userId, 'user', conversation);
  const reply = await geminiRequest(conversation, userHistory);
  await saveMessageToDb(userId, 'model', reply);
  return reply;
};

const handleIncomingMessage = async (message) => {
  try {
    const { conversation } = message.message;
    const userId = message.userId;
    const sock = message.sock;
    let userHistory = await loadUserHistoryFromDb(userId);


    // Cek apakah pesan adalah command
    if (conversation.startsWith('/')) {
      return await handleCommand(conversation, userId);
    }

      const userData = await loadActiveUser(userId);

    // Cek apakah user aktif
    if(userData && userData.isActive){
      return await handleActiveUser(conversation, userId, userData, sock, userHistory);
    }

      // Cek apakah bot perlu diaktifkan
     if (conversation.toLowerCase().includes("paw")) {
         return await activateBot(conversation, userId, userHistory);
     }

      return null;
  } catch (err) {
    console.error("Error handling message:", err.message);
    return "Maaf, Bot lagi error";
  }
};

module.exports = { handleIncomingMessage };
