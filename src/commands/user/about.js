module.exports = {
    name: 'about',
    description: 'Informasi tentang bot ini.',
    execute: async () => {
      return {
        type: 'text',
        content: `🤖 *Tentang Bot Pawarna:*\n
  Nama: Pawarna
  Usia: 21 tahun (Gen Z)
  Skill: Back-end Programming (JavaScript & Java)
  Hobi: Jawab pertanyaan sambil gaya Gen Z 😎.`
      }
    }
  };
  