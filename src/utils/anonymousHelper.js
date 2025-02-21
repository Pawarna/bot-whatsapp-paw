// utils/anonymousHelper.js
const anonymousService = require('../services/anonymousService');

async function buildStatsMessage() {
  const stats = await anonymousService.getStatistics();
  let message = `📊 *Statistik Anonim*\n👥 Pengguna Online: ${stats.totalOnline}\n`;
  if (stats.topTopics && stats.topTopics.length > 0) {
    message += '🏷 Top 5 Topik:\n';
    stats.topTopics.forEach((item, index) => {
      message += `${index + 1}. ${item.topic} (${item.count})\n`;
    });
  } else {
    message += '🏷 Belum ada topik yang populer.';
  }
  return message;
}

// Fungsi validasi: hanya digunakan di chat pribadi (bukan grup)
function validatePrivateChat(senderId) {
  return !senderId.includes('@g.us');
}

module.exports = { buildStatsMessage, validatePrivateChat };
