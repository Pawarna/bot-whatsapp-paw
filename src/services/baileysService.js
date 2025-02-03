const { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');
const { handleIncomingMessage } = require('../controllers/messageHandler.js');
const { logger } = require('../utils/logger.js');
const { loadUserHistoryFromDb } = require('../database/chatHistory.js');
const { getMessageType, getCaptionMessage } = require('../utils/checkMessageType.js')

let sock;

const connectToWhatsApp = async () => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        sock = makeWASocket({
            printQRInTerminal: true,
            auth: state
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger('Connection closed. Reconnecting...');
                if (shouldReconnect) connectToWhatsApp();
            } else if (connection === 'open') {
                logger('WhatsApp connection established.');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (messageUpdate) => {
            try {
              // Ambil pesan pertama dari message update
              const receivedMessage = messageUpdate.messages[0];
              console.log(JSON.stringify(messageUpdate, undefined, 2));
          
              // Abaikan jika tidak ada pesan atau pesan dari diri sendiri
              if (!receivedMessage.message || receivedMessage.key.fromMe) {
                return;
              }
          
              // Ambil ID user dan nama pengguna
              const senderId = receivedMessage.key.remoteJid;
              const senderName = receivedMessage.pushName;
              let mediaBuffer = null;
              let messageCaption = null;
          
              // Cek tipe pesan dan download media jika ada
              const messageType = getMessageType(receivedMessage);
              if (messageType) {
                mediaBuffer = await downloadMediaMessage(
                  receivedMessage,
                  'buffer',
                  {},
                  {
                    logger: console,
                    reuploadOnFail: false,
                  }
                );
                 messageCaption = getCaptionMessage(receivedMessage);
              }
          
              // Ambil isi pesan dari caption atau conversation atau extended text
              const incomingText = messageCaption || receivedMessage.message.conversation || receivedMessage.message.extendedTextMessage?.text;
               // Load riwayat chat dari database
              const chatHistory = await loadUserHistoryFromDb(senderId);
          
              console.log(mediaBuffer);
              logger(`Received message from ${senderId}: ${incomingText ? incomingText : `${messageType}`}`);
          
              // Proses pesan dan dapatkan reply
              const result = await handleIncomingMessage({
                conversation: incomingText,
                media: {
                  mediaBuffer: mediaBuffer,
                  messageType: messageType,
                  messageCaption: messageCaption,
                },
                senderId: senderId,
                senderName: senderName,
                sock,
                chatHistory: chatHistory,
              });
          
              // Kirim reply jika ada
              if (result) {
                if (result.type === 'text') {
                  await sock.sendMessage(senderId, { text: result.content });
                } else if (result.type === 'sticker') {
                  await sock.sendMessage(senderId, { sticker: result.content });
                } else if (result.type === 'video') {
                  await sock.sendMessage(senderId, { video: { url: result.content } });
                }
                logger(`Reply sent to ${senderId}`);
              }

            } catch (error) {
              logger(`Error processing message: ${error.message}`);
            }

          });
    } catch (error) {
        logger(`Failed to connect to WhatsApp: ${error.message}`);
    }
};

module.exports = { connectToWhatsApp };
