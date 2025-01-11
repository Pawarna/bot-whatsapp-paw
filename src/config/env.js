require('dotenv').config()

module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PORT: process.env.PORT || 3000
}