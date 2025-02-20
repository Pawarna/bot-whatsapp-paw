require('dotenv').config();

module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PORT: process.env.PORT || 3000,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
};
