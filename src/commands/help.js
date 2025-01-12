module.exports = {
    name: "help",
    description: "Menampilkan daftar command yang tersedia.",
    execute: async () => {
        return `📖 *Daftar Command Pawarna Bot:*\n
1. */help* - Menampilkan daftar command.
2. */about* - Informasi tentang bot ini.
3. */greet <name>* - Memberikan salam ke <name>.
4. */tugas <context>* - Mengingatkan tugas yang tersedia.
5. Pesan lain - Dijawab dengan gaya Pawarna (Gen Z).`;
    },
};