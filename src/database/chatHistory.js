const { createConnection } = require('../config/db.js');
const { logger } = require('../utils/logger.js');

    // Fungsi untuk menyimpan pesan ke database
    const saveMessageToDb = async (userId, role, message) => {
        const query = `
            INSERT INTO chat_histories (userId, role, message)
            VALUES (?, ?, ?)
        `;
        const values = [userId, role, message];
    
        let connection;
    
        try {
            connection = await createConnection();
            await connection.query(query, values);
        } catch (err) {
            console.error("Error saving message to DB: ", err.message);
        } finally{
           if (connection) {
               await connection.end()
           }
        }
    };
    
    // Fungsi untuk mengambil history chat user dari database
    const loadUserHistoryFromDb = async (userId) => {
        const query = `
            SELECT role, message
            FROM chat_histories
            WHERE userId = ?
            ORDER BY timestamp DESC
            LIMIT 10
        `;
         const values = [userId];
         let connection;
        try {
             connection = await createConnection();
            const [rows] = await connection.query(query, values);
            return rows.reverse().map((row) => ({
                role: row.role,
                parts: [{ text: row.message }],
            }));
         }catch (err) {
           console.error("Error loading message from DB: ", err.message);
           return [];
         }finally{
           if (connection) {
               await connection.end()
           }
        }
    };

    const resetChatHistory = async (userId) => {
        let conn
        try {
            conn = await createConnection();

            const query = 'DELETE FROM chat_histories where userId = ';
            const value = [userId];

            await conn.query(query, value);

            return true  
        } catch (error) {
            logger.error("Gagal chat history: ", error);
            return false
        } finally{
            await conn.end();
        }
    }
   
module.exports = { saveMessageToDb, loadUserHistoryFromDb, resetChatHistory };
