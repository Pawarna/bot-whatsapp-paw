const { createCanvas, registerFont } = require('canvas');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Sticker } = require('wa-sticker-formatter'); // Import wa-sticker-formatter

module.exports = {
    name: 'brat',
    description: 'Convert text to sticker',
    async execute({ args, sock, senderName }) {
        const text = args.join(' ');

        if (!text) {
            return {
                type: 'text',
                content: '⚠️ Mohon berikan teks. Contoh: /brat Aku jago loh',
            };
        }

        registerFont(path.join('fonts', 'arial.ttf'), { family: 'Arial' });
        registerFont(path.join('fonts', 'NotoColorEmoji-Regular.ttf'), { family: 'Noto Color Emoji' });

        /**
         * Fungsi untuk membungkus teks agar tiap baris tidak melebihi maxWidth.
         */
        function wrapText(text, maxWidth, ctx) {
            const words = text.split(' ');
            let lines = [];
            let currentLine = '';

            for (let word of words) {
                let testLine = currentLine ? currentLine + ' ' + word : word;
                if (ctx.measureText(testLine).width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) lines.push(currentLine);
            return lines;
        }

        /**
         * Fungsi untuk menentukan ukuran font maksimum yang memungkinkan:
         * - Tiap baris hasil wrap tidak melebihi maxWidth.
         * - Total tinggi teks tidak melebihi maxHeight.
         * Menggunakan binary search untuk mendapatkan ukuran font terbaik.
         */
        function determineFontSize(text, maxWidth, maxHeight, ctx) {
            let min = 5,
                max = 300;
            let best = min;

            while (min <= max) {
                let mid = Math.floor((min + max) / 2);
                ctx.font = `${mid}px "Noto Color Emoji" ,Arial`;
                let lines = wrapText(text, maxWidth, ctx);
                let lineHeight = mid * 1.2;
                let totalHeight = lines.length * lineHeight;
                let horizontalFit = lines.every((line) => ctx.measureText(line).width <= maxWidth);

                if (totalHeight <= maxHeight && horizontalFit) {
                    best = mid;
                    min = mid + 1;
                } else {
                    max = mid - 1;
                }
            }
            return best;
        }

        /**
         * Fungsi utama untuk membuat gambar stiker dengan teks yang di-wrap,
         * ukuran font disesuaikan, dan tiap baris dijustify (rata kiri-kanan).
         */
        function createTextImage(text) {
            const canvasWidth = 512;
            const canvasHeight = 512;
            const padding = 20;

            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Gambar background putih
            ctx.fillStyle = '#FEFEFE';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Set properti teks
            ctx.fillStyle = '#191919';
            ctx.textBaseline = 'middle';

            const maxAllowedWidth = canvasWidth - 2 * padding;
            const maxAllowedHeight = canvasHeight - 2 * padding;

            // Tentukan ukuran font terbaik
            const fontSize = determineFontSize(text, maxAllowedWidth, maxAllowedHeight, ctx);
            ctx.font = `${fontSize}px "Noto Color Emoji", Arial`;
            const lineHeight = fontSize * 1.2;

            // Bungkus teks dengan ukuran font final
            const lines = wrapText(text, maxAllowedWidth, ctx);
            const totalTextHeight = lines.length * lineHeight;
            const startY = padding + (maxAllowedHeight - totalTextHeight) / 2 + lineHeight / 2;

            // Gambar tiap baris dengan justify (rata kiri-kanan) jika memungkinkan
            let y = startY;
            for (let line of lines) {
                let wordsInLine = line.split(' ');

                if (wordsInLine.length > 1) {
                    // Hitung total lebar semua kata
                    let totalWordsWidth = wordsInLine.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
                    // Ruang kosong yang tersisa untuk diisi spasi
                    let extraSpace = maxAllowedWidth - totalWordsWidth;
                    let gapCount = wordsInLine.length - 1;
                    let gapSpacing = extraSpace / gapCount;

                    let x = padding;
                    for (let i = 0; i < wordsInLine.length; i++) {
                        let word = wordsInLine[i];
                        ctx.fillText(word, x, y);
                        x += ctx.measureText(word).width + gapSpacing;
                    }
                } else {
                    // Jika hanya ada satu kata, gambar rata kiri pada padding
                    ctx.fillText(line, padding, y);
                }
                y += lineHeight;
            }

            return canvas.toBuffer();
        }

        /**
         * Fungsi untuk membuat stiker dengan efek blur dan menambahkan metadata
         * _author_ dan _pack_ menggunakan wa-sticker-formatter.
         */
        async function createSticker(text) {
            // Pertama, buat gambar teks dengan canvas
            const imageBuffer = createTextImage(text);

            // Terapkan efek blur menggunakan sharp
            const blurredBuffer = await sharp(imageBuffer).blur(1).toFormat('webp').toBuffer();

            // Buat sticker dengan metadata menggunakan wa-sticker-formatter
            const sticker = new Sticker(blurredBuffer, {
                pack: 'created by ' + senderName, // Ganti dengan nama pack yang diinginkan
                author: `@paww-bot • ${sock.user.id.split(':')[0]}`, // Ganti dengan nama author yang diinginkan
                type: 'full', // Opsi: 'full' atau 'crop'
                quality: 100, // Kualitas sticker (default 100)
            });

            // Mengembalikan buffer stiker final
            return await sticker.toBuffer();
        }

        try {
            const stickerBuffer = await createSticker(text);
            return { type: 'sticker', content: stickerBuffer };
        } catch (error) {
            console.error('Error creating sticker:', error);
            return { type: 'text', content: '⚠️ Gagal membuat stiker.' };
        }
    },
};
