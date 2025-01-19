const { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');
const { handleIncomingMessage } = require('../controllers/messageHandler.js');
const { logger } = require('../utils/logger.js');
const { loadUserHistoryFromDb } = require('../database/chatHistory.js');

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

            if (!msg.message || msg.key.fromMe || msg.key.remoteJid === '6281575257217@s.whatsapp.net') {
              return;
            }

            const userId = msg.key.remoteJid;
            let imageBuffer = null;


            if (msg.message?.imageMessage) {
                imageBuffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadOnFail: false,
                    }
                );
            }

              const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
              const userHistory = await loadUserHistoryFromDb(userId);
              
               logger(`Received message from ${userId}: ${incomingMessage ? incomingMessage : "pesan berupa gambar"}`);
              const reply = await handleIncomingMessage({
                  message: { 
                     conversation: incomingMessage,
                     imageBuffer,
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
