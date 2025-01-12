const { makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage,  } = require('@whiskeysockets/baileys');
const {writeFile} = require('fs/promises');
const {handleIncomingMessage} = require('../controllers/messageHandler.js');
const {logger} = require('../utils/logger.js');

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

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid == "6281575257217@s.whatsapp.net") return;

        // Downloading Image not optimalized
        // const messageType = Object.keys(msg.message)[0];
        // console.log(messageType)
        // if (messageType === 'imageMessage'){
        //     const buffer =  await downloadMediaMessage(
        //         m,
        //         'buffer',
        //         { },
        //         {
        //             logger,
        //             reuploadRequest: sock.updateMediaMessage
        //         }
        //     );
        //     const filename = `${Date.now()}.jpeg`;
        //     await writeFile(`../../media/${filename}`, buffer);
        // }

        const incomingMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

        if(incomingMessage) {
            logger(`Incoming message from ${msg.key.remoteJid}: ${incomingMessage}`);
            const reply = await handleIncomingMessage({message: {conversation: incomingMessage} });
            sock.sendMessage(msg.key.remoteJid, { text: reply });
        }
    });
};

module.exports = {connectToWhatsApp};

