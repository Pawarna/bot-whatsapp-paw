const {createConnection} = require('../config/db.js');
const { geminiRequest } = require('../services/geminiService.js');

module.exports = {
    name: "tugas",
    description: "Menampilkan tugas kuliah yang ada.",
    execute: async (args) => {
        try {
            const conn = await createConnection();
                const [rows] = await conn.execute("SELECT * FROM task WHERE dueDate >= NOW() ORDER BY dueDate ASC");
                if (rows.length > 0) {
                    let taskMessages = 'Halo! Berikut tugas yang tersedia:\n\n';
                    rows.forEach(task => {
                        taskMessages += `Subject: ${task.subject}\nJudul: ${task.taskTitle}\nDeskripsi: ${task.description}\nTanggal Tugas: ${task.taskDate}\nDeadline: ${task.dueDate}\nTipe: ${task.taskType}\nMetode Pengumpulan: ${task.submissionMethod}\n\n`;
                    });

                    
                    if (!args){
                        return await geminiRequest(taskMessages + 'Rapihkan agar mudah dibaca')
                    }

                    return await geminiRequest(taskMessages + `Tampilkan hanya tugas ${args}`)
                } else {
                    return "Selamat! tidak ada tugas hari ini"
                }
            await conn.end();
        } catch (error) {
            console.error("Gagal mendapatkan tugas")
        }

    }
}