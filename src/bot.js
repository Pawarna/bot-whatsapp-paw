require('dotenv').config();
const { connectToWhatsApp } = require('./services/baileysService.js');
const { logger } = require('./utils/logger.js');

const startApp = async () => {
    await connectToWhatsApp();
    logger('WhatsApp bot is running...');
};

startApp();