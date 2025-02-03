module.exports = {
    name: 'greet',
    description: 'Memberikan salam personal.',
    execute: async ({args}) => {
      if (!args || args.length === 0) {
        return {
          type: 'text',
          content: '⚠️ Harap masukkan nama setelah perintah /greet. Contoh: /greet Pawarna'
        };
      }
      const name = args.join(' ');
      return {
        type: "text",
        content: `👋 Halo ${name}! Pawarna menyapa dengan gaya Gen Z banget! 😎` 
      };
    },
  };
  