module.exports = {
    name: 'greet',
    description: 'Memberikan salam personal.',
    execute: async (args) => {
      if (!args || args.length === 0) {
        return '⚠️ Harap masukkan nama setelah perintah /greet. Contoh: /greet Pawarna';
      }
      const name = args.join(' ');
      return `👋 Halo ${name}! Pawarna menyapa dengan gaya Gen Z banget! 😎`;
    },
  };
  