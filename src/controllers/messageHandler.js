const { loadActiveUser, saveActiveUser } = require('../utils/activeUserUtils.js');
const { commandRouter } = require('../routes.js');
const { geminiRequest, analyzeFile } = require('../services/geminiService.js');
const { logger } = require('../utils/logger.js');
const { saveMessageToDb } = require('../database/chatHistory.js');
const anonymousService = require('../services/anonymousService.js');

const activeDuration = 5 * 60 * 1000;

const handleIncomingMessage = async (message) => {
    try {
        const { conversation, senderId, sock, chatHistory, receivedMessage, senderName } = message;
        const { mediaBuffer, messageType, messageCaption } = message.media;

        const prefixes = ['/', '.', '!'];

        if (conversation && prefixes.some((prefix) => conversation.startsWith(prefix))) {
            logger.info(`Menjalankan command untuk user ${senderId}: ${conversation}`);
            await sock.sendPresenceUpdate('composing', senderId);

            return await commandRouter({
                conversation,
                senderId,
                sock,
                media: { mediaBuffer, messageType, messageCaption },
                senderName,
            });
        }

        if (await anonymousService.isInChat(senderId)) {
            // Teruskan pesan ke pasangan
            await anonymousService.forwardMessage(sock, senderId, receivedMessage);
            return;
        }

        let userData = await loadActiveUser(senderId);
        const namedConversation = `@${senderName}: ${conversation}`;

        // Cek Inaktif diawal
        if (userData && userData.isActive) {
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

            await sock.sendPresenceUpdate('composing', senderId);

            await saveActiveUser(senderId, updatedUserData);

            if (mediaBuffer) {
                await saveMessageToDb(senderId, 'user', `@${senderName}: Pesan berupa file : ${messageType}, dengan caption :${messageCaption}`);
                const replyMessage = await analyzeFile(mediaBuffer, messageType, messageCaption, chatHistory);
                await saveMessageToDb(senderId, 'model', replyMessage);
                return {
                    type: 'text',
                    content: replyMessage,
                };
            }
            if (conversation) {
                logger.info(`Balas pesan ke ${senderId}: ${conversation}`);
                await saveMessageToDb(senderId, 'user', namedConversation);

                const replyMessage = await geminiRequest(namedConversation, chatHistory);
                await saveMessageToDb(senderId, 'model', replyMessage);

                await sock.sendMessage(senderId, { text: replyMessage });

                const stopKeyword = ['stop', 'diem', 'berisik'];
                if (stopKeyword.some((keyword) => conversation.includes(keyword)) && conversation.includes('paw')) {
                    userData.isActive = false;
                    const updatedUserData = {
                        ...userData,
                        lastActive: Date.now(),
                    };

                    await saveActiveUser(senderId, updatedUserData);
                }

                return;
            }
        }

        // Cek jika bot perlu aktivasi
        if (conversation && conversation.toLowerCase().includes('paw')) {
            logger.info(`User ${senderId} memanggil paw, mengaktifkan bot`);

            const newUserData = {
                isActive: true,
                lastActive: Date.now(),
            };
            await saveActiveUser(senderId, newUserData);
            await saveMessageToDb(senderId, 'user', namedConversation);

            if (mediaBuffer) {
                await saveMessageToDb(senderId, 'user', `@${senderName}: Pesan berupa file : ${messageType}, dengan caption :${messageCaption}`);
                const replyMessage = await analyzeFile(mediaBuffer, messageType, messageCaption, chatHistory);
                await saveMessageToDb(senderId, 'model', replyMessage);
                return {
                    type: 'text',
                    content: replyMessage,
                };
            }
            const replyMessage = await geminiRequest(namedConversation, chatHistory);
            await saveMessageToDb(senderId, 'model', replyMessage);
            return {
                type: 'text',
                content: replyMessage,
            };
        }

        return null;
    } catch (err) {
        logger.error('Error handling message:', err);
        return {
            type: 'text',
            content: 'Maaf, bot lagi error',
        };
    }
};

module.exports = { handleIncomingMessage };
