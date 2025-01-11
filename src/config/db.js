const mysql = require('mysql2/promise');
const {DB_HOST, DB_NAME, DB_PASS, DB_USER}= require('./env.js');

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password : DB_PASS,
            database: DB_NAME,            
        });

        return connection
    } catch (error) {
        console.error("Error connecting to database", error.message);
        throw new Error("Failed to connect database")
    }
}

module.exports = {createConnection}