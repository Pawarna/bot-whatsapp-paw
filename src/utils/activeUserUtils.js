const path = require('path');
const fs = require('fs').promises;

const activeUsersDir = 'active_users';

const loadActiveUser = async (userId) => {
    const filePath = path.join(activeUsersDir, `${userId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null; // File belum ada atau error
    }
  };

const saveActiveUser = async (userId, userData) => {
    const filePath = path.join(activeUsersDir, `${userId}.json`);
    await fs.mkdir(activeUsersDir, { recursive: true }); // Buat direktori kalo belum ada
    await fs.writeFile(filePath, JSON.stringify(userData));
};

module.exports = { loadActiveUser, saveActiveUser };
