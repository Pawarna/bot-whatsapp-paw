const { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage,  } = require('@whiskeysockets/baileys');
const {writeFile} = require('fs/promises');
const {handleIncomingMessage} = require('../controllers/messageHandler.js');
const {logger} = require('../utils/logger.js');
const { loadActiveUser, saveActiveUser } = require('../utils/activeUserUtils.js');

const activeDuration = 5 * 60 * 1000;
let sock;

const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger('Connection closed, reconnecting:');
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            logger('Connection opened');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
        try {
          const msg = m.messages[0];
          if (
            !msg.message ||
            msg.key.fromMe ||
            msg.key.remoteJid == "6281575257217@s.whatsapp.net"
          )
            return;
      
          const incomingMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          if (!incomingMessage) return;
          const userId = msg.key.remoteJid;
      
          
            const reply = await handleIncomingMessage({
              message: { conversation: incomingMessage },
              userId: userId, //kirim userid
              sock: sock //kirim sock
            });
            if(reply){
              sock.sendMessage(userId, { text: reply });
            }
        } catch (e) {
          console.log(e);
        }
      });
      
};
    
    

module.exports = {connectToWhatsApp};

