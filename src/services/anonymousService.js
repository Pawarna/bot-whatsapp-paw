// services/anonymousService.js
const {createConnection} = require('../config/db.js');

const COOLDOWN_SECONDS = 60; // periode cooldown dalam detik

/**
 * Mengecek apakah dua user sedang dalam periode cooldown.
 */
async function isOnCooldown(current, candidate, connection) {
  const [rows] = await connection.execute(
    `SELECT * FROM recent_pairs
     WHERE ((user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [current, candidate, candidate, current, COOLDOWN_SECONDS]
  );
  return rows.length > 0;
}

/**
 * Menambahkan pasangan ke tabel recent_pairs sebagai catatan _cooldown_.
 */
async function recordRecentPair(user1, user2, connection) {
  await connection.execute(
    'INSERT INTO recent_pairs (user1, user2) VALUES (?, ?)',
    [user1, user2]
  );
}

/**
 * Menambahkan pengguna ke dalam sistem chat anonim.
 * Opsi parameter: { gender, topic }
 */
async function startChat(userJid, sock, options = {}) {
  const { gender = null, topic = null } = options;
  const connection = await createConnection();
  try {
    // Cek apakah pengguna sudah terdaftar
    const [rows] = await connection.execute(
      'SELECT partner_jid FROM anonymous_users WHERE jid = ?',
      [userJid]
    );
    if (rows.length > 0) {
      // Jika pengguna sudah terdaftar dan sudah memiliki pasangan
      if (rows[0].partner_jid) {
        await sock.sendMessage(userJid, { text: "Kamu sudah berada dalam chat anonim." });
        return;
      }
      // Jika pengguna sudah menunggu, beri tahu saja
      await sock.sendMessage(userJid, { text: "Masih menunggu pasangan untuk chat anonim..." });
      return;
    }

    // Cari kandidat pengguna lain yang sedang menunggu (partner_jid IS NULL) dan bukan dirinya sendiri
    let waitingQuery = 'SELECT jid, gender, topic FROM anonymous_users WHERE partner_jid IS NULL AND jid != ?';
    const params = [userJid];

    // Jika topic disediakan, cari pasangan dengan topic yang sama
    if (topic) {
      waitingQuery += ' AND topic = ?';
      params.push(topic);
    }
    // Jika gender disediakan, cari pasangan dengan gender lawan (atau tidak di-set)
    if (gender) {
      const oppositeGender =
        gender.toLowerCase() === 'male' || gender.toLowerCase() === 'pria'
          ? 'female'
          : 'male';
      waitingQuery += ' AND (gender = ? OR gender IS NULL)';
      params.push(oppositeGender);
    }
    // Ambil semua kandidat yang sesuai
    const [waitingRows] = await connection.execute(waitingQuery, params);

    let candidate = null;
    for (const row of waitingRows) {
      if (!(await isOnCooldown(userJid, row.jid, connection))) {
        candidate = row;
        break;
      }
    }

    if (candidate) {
      const partnerJid = candidate.jid;
      // Masukkan pengguna baru ke tabel dengan pasangan yang ditemukan
      await connection.execute(
        'INSERT INTO anonymous_users (jid, partner_jid, gender, topic) VALUES (?, ?, ?, ?)',
        [userJid, partnerJid, gender, topic]
      );
      // Perbarui kandidat agar memiliki pasangan
      await connection.execute(
        'UPDATE anonymous_users SET partner_jid = ? WHERE jid = ?',
        [userJid, partnerJid]
      );
      await sock.sendMessage(userJid, { text: "✅ Pasangan ditemukan! Mulai chat anonim." });
      await sock.sendMessage(partnerJid, { text: "✅ Pasangan ditemukan! Mulai chat anonim." });
    } else {
      // Jika tidak ada pasangan, masukkan pengguna ke dalam tabel sebagai status menunggu
      await connection.execute(
        'INSERT INTO anonymous_users (jid, partner_jid, gender, topic) VALUES (?, NULL, ?, ?)',
        [userJid, gender, topic]
      );
      await sock.sendMessage(userJid, { text: "⏳ Menunggu pasangan untuk chat anonim..." });
    }
  } catch (error) {
    console.error('Error pada startChat:', error);
  } finally {
    connection.end();
  }
}

/**
 * Mengecek apakah pengguna sudah berada dalam chat anonim (memiliki pasangan).
 */
async function isInChat(userJid) {
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT partner_jid FROM anonymous_users WHERE jid = ?',
      [userJid]
    );
    if (rows.length > 0 && rows[0].partner_jid) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error pada isInChat:', error);
    return false;
  } finally {
    connection.end();
  }
}

/**
 * Meneruskan pesan ke pasangan chat anonim.
 */
async function forwardMessage(sock, sender, msg) {
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT partner_jid FROM anonymous_users WHERE jid = ?',
      [sender]
    );
    if (rows.length > 0 && rows[0].partner_jid) {
      const partnerJid = rows[0].partner_jid;

      const message = msg.message?.conversation || msg.message?.extendedTextMessage?.text

      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
      const quotedKey = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
      const participant = msg.message.extendedTextMessage?.contextInfo?.participant;
      const messageId = msg.key?.id;

      if (message) {
        await sock.sendMessage(partnerJid, { 
          text: message,
          contextInfo: quoted
              ? { 
                    quotedMessage: quoted, 
                    stanzaId: quotedKey,
                    participant: msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation? participant : partnerJid  // pastikan participant mengacu ke pengirim asli pesan yang direply
                }
              : undefined
        },
        { messageId }
      );
      } else if (msg.message?.reactionMessage){
        await sock.sendMessage(
          partnerJid,
          {
              react: {
                  text: msg.message.reactionMessage?.text,
                  key: {
                    remoteJid: partnerJid,
                    fromMe: !msg.message.reactionMessage?.key?.fromMe,
                    id: msg.message.reactionMessage?.key?.id,
                  }
              }
          }
        )
      } else if (msg.message?.pollCreationMessageV3) {
        const poll = msg.message.pollCreationMessageV3;
        const question = poll.name;
        const options = poll.options.map(opt => opt.optionName);
        
        await sock.sendMessage(
          partnerJid,
          {
            poll: {
              name: question,
              values: options,
              selectableCount: poll.selectableOptionsCount || 1
            }
          },
          { messageId: messageId } // Gunakan ID yang sama atau generate baru
        );
      }
  
    }
  } catch (error) {
    console.error('Error pada forwardMessage:', error);
  } finally {
    connection.end();
  }
}

/**
 * Mengeluarkan pengguna dari mode chat anonim.
 * Opsi: jika recordCooldown = true, maka jika user memiliki pasangan,
 * catat pasangan tersebut ke tabel recent_pairs (untuk mencegah pengulangan dalam periode cooldown).
 */
async function exitChat(userJid, sock, options = {}) {
  const { recordCooldown = false } = options;
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT partner_jid FROM anonymous_users WHERE jid = ?',
      [userJid]
    );
    if (rows.length === 0) {
      await sock.sendMessage(userJid, { text: "Kamu tidak berada dalam chat anonim." });
      return;
    }

    const partnerJid = rows[0].partner_jid;
    // Hapus entri user yang keluar
    await connection.execute(
      'DELETE FROM anonymous_users WHERE jid = ?',
      [userJid]
    );

    if (partnerJid) {
      // Jika ada pasangan dan opsi recordCooldown aktif,
      // catat pasangan ke tabel recent_pairs agar tidak dipasangkan kembali segera.
      if (recordCooldown) {
        await recordRecentPair(userJid, partnerJid, connection);
      }
      // Perbarui entri pasangan agar partner_jid menjadi NULL
      await connection.execute(
        'UPDATE anonymous_users SET partner_jid = NULL WHERE jid = ?',
        [partnerJid]
      );
      await sock.sendMessage(userJid, { text: "🚪 Kamu telah keluar dari chat anonim." });
      await sock.sendMessage(partnerJid, { text: "⚠️ Pasangan kamu telah keluar dari chat anonim." });
    } else {
      // Jika user hanya menunggu
      await sock.sendMessage(userJid, { text: "🚪 Kamu telah keluar dari chat anonim." });
    }
  } catch (error) {
    console.error('Error pada exitChat:', error);
  } finally {
    connection.end();
  }
}

module.exports = {
  startChat,
  isInChat,
  forwardMessage,
  exitChat,
};
