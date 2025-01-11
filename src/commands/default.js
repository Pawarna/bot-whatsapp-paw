module.exports = {
    name: 'default',
    description: 'Respon default jika command tidak dikenali.',
    execute: async () => {
      return '⚠️ Maaf, command tidak dikenali. Ketik */help* untuk melihat daftar command yang tersedia.';
    },
  };
  