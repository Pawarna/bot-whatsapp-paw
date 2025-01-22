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
            const msg = messageUpdate.messages[0];
            console.log(JSON.stringify(messageUpdate, undefined, 2))

            if (!msg.message || msg.key.fromMe) {
              return;
            }

            const userId = msg.key.remoteJid;
            let fileBuffer = null;
            let caption = null;

            const mimetype = getMessageType(msg)
            if (mimetype) {
                fileBuffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadOnFail: false,
                    }
                );

                caption = getCaptionMessage(msg);
            }

              const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
              const userHistory = await loadUserHistoryFromDb(userId);
              
              console.log(fileBuffer)
              logger(`Received message from ${userId}: ${incomingMessage ? incomingMessage : `${mimetype}`}`);
              const reply = await handleIncomingMessage({
                  message: { 
                     conversation: incomingMessage,
                     file : {
                        fileBuffer,
                        mimetype,
                        caption,
                     }
                    },
                  userId,
                  sock,
                  userHistory
              });
    
            if (reply) {
                  await sock.sendMessage(userId, { text: reply });
                   logger(`Reply sent to ${userId}`);
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
