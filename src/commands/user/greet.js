module.exports = {
    name: 'greet',
    description: 'Memberikan salam personal.',
    execute: async ({ senderName, senderId }) => {
        if (!senderName && senderId.includes('@g.us')) {
            return {
                type: 'text',
                content: 'Bapak/Ibu kamu selalu menyebutmu dalam doanya',
            };
        }
        senderId = '@' + senderId.split('@')[0];
        return {
            type: 'text',
            content: `👋 Halo ${senderName || senderId}! Pawarna menyapa dengan gaya Gen Z banget! 😎`,
        };
    },
};
