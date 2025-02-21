const { default: axios } = require('axios');
const { logger } = require('../../utils/logger.js');

// Load from ENV
process.loadEnvFile();

const _userAgent = process.env.USER_AGENT;
const _xIgAppId = process.env.X_IG_APP_ID;

if (!_userAgent || !_xIgAppId) {
    logger.error('Required headers not found in ENV');
    process.exit(1);
}

// Function to get instagram post ID from URL string
const getId = (url) => {
    const regex = /instagram.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|stories)\/([A-Za-z0-9-_]+)/;
    const match = url.match(regex);
    return match && match[2] ? match[2] : null;
};

// Function to get instagram data from URL string
const getInstagramGraphqlData = async (url) => {
    const igId = getId(url);
    if (!igId) return 'Invalid URL';

    // Fetch graphql data from instagram post
    const graphql = new URL(`https://www.instagram.com/api/graphql`);
    graphql.searchParams.set('variables', JSON.stringify({ shortcode: igId }));
    graphql.searchParams.set('doc_id', '10015901848480474');
    graphql.searchParams.set('lsd', 'AVqbxe3J_YA');

    const response = await fetch(graphql, {
        method: 'POST',
        headers: {
            'User-Agent': _userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-IG-App-ID': _xIgAppId,
            'X-FB-LSD': 'AVqbxe3J_YA',
            'X-ASBD-ID': '129477',
            'Sec-Fetch-Site': 'same-origin',
        },
    });

    const json = await response.json();
    const items = json?.data?.xdt_shortcode_media;
    // You can return the entire items or create your own JSON object from them
    // return items;

    // Return custom json object
    return {
        __typename: items?.__typename,
        shortcode: items?.shortcode,
        dimensions: items?.dimensions,
        display_url: items?.display_url,
        display_resources: items?.display_resources,
        has_audio: items?.has_audio,
        video_url: items?.video_url,
        video_view_count: items?.video_view_count,
        video_play_count: items?.video_play_count,
        is_video: items?.is_video,
        caption: items?.edge_media_to_caption?.edges[0]?.node?.text,
        is_paid_partnership: items?.is_paid_partnership,
        location: items?.location,
        owner: items?.owner,
        product_type: items?.product_type,
        video_duration: items?.video_duration,
        thumbnail_src: items?.thumbnail_src,
        clips_music_attribution_info: items?.clips_music_attribution_info,
        sidecar: items?.edge_sidecar_to_children?.edges,
    };
};

async function ambilInfoPostingan(url) {
    const data = await getInstagramGraphqlData(url);

    let hasil = {
        author: '',
        desc: '',
        media: [],
    };

    if (data.__typename === 'XDTGraphVideo') {
        // Reel
        hasil.author = data.owner.username;
        hasil.desc = data.caption;
        hasil.media.push({
            type: 'video',
            url: data.video_url,
        });
    } else if (data.__typename === 'XDTGraphSidecar') {
        // Postingan Sidecar (Carousel)
        hasil.author = data.owner.username;
        hasil.desc = data.caption;

        // Ambil URL dari masing-masing item di sidecar
        data.sidecar.forEach((item) => {
            const node = item.node;
            let jenisMedia = 'unknown';
            let urlMedia = null;

            if (node.__typename === 'XDTGraphImage') {
                jenisMedia = 'image';
                urlMedia = node.display_url;
            } else if (node.__typename === 'XDTGraphVideo') {
                jenisMedia = 'video';
                urlMedia = node.video_url;
            }

            hasil.media.push({
                type: jenisMedia,
                url: urlMedia,
            });
        });
    } else if (data.__typename === 'XDTGraphImage') {
        // Postingan Singel (Gambar)
        hasil.author = data.owner.username;
        hasil.desc = data.caption;
        hasil.media.push({
            type: 'image',
            url: data.display_url,
        });
    } else {
        return null; // Jenis postingan tidak dikenali
    }

    return hasil;
}

module.exports = {
    name: 'ig',
    description: 'Download feed/reels dari Instagram',
    async execute({ args, sock, senderId }) {
        const url = args[0];

        if (!url) {
            await sock.sendMessage(senderId, { text: `⚠ Harap masukkan link Instagram yang valid. Contoh: /${this.name} url-instagram` });
            return;
        }

        let datas;
        let caption;
        try {
            datas = await ambilInfoPostingan(url);

            if (!datas || !datas.media || datas.media.length === 0) {
                await sock.sendMessage(senderId, {
                    text: '⚠ Gagal menemukan media pada postingan Instagram. Pastikan link yang diberikan benar dan postingan bersifat publik.',
                });
                return;
            }

            caption = `${datas.author}\n\n${datas.desc ? datas.desc : ''}`;
        } catch (error) {
            logger.error('Error saat mengambil data dari Instagram:', error);
            await sock.sendMessage(senderId, {
                text: '⚠ Terjadi kesalahan saat mengambil data dari Instagram. Pastikan link tersebut valid dan postingan bersifat publik.',
            });
            return;
        }

        try {
            await sock.sendMessage(senderId, {
                text: '🔄 Sedang mengunduh media dari postingan Instagram...',
            });

            await sock.sendPresenceUpdate('composing', senderId);

            if (datas.media.length === 1) {
                const response = await axios.get(data.url, { responseType: 'stream' });
                await sock.sendMessage(senderId, { [datas.media.type]: { stream: response.data }, caption });
                return;
            }

            for (const data of datas.media) {
                if (!['image', 'video'].includes(data.type)) {
                    await sock.sendMessage(senderId, {
                        text: `⚠ Tipe media \"${data.type}\" tidak didukung.`,
                    });
                    continue;
                }

                try {
                    const response = await axios.get(data.url, { responseType: 'stream' });
                    await sock.sendMessage(senderId, { [data.type]: { stream: response.data } });
                } catch (err) {
                    logger.error('Error saat mengunduh media:', err);
                    await sock.sendMessage(senderId, {
                        text: '⚠ Terjadi kesalahan saat mengunduh salah satu media.',
                    });
                }
            }

            await sock.sendMessage(senderId, { text: caption });
            return;
        } catch (error) {
            logger.error('Error saat mengunduh atau mengirimkan media:', error);
            await sock.sendMessage(senderId, { text: '⚠ Terjadi kesalahan saat mengunduh atau mengirimkan media.' });
        }
    },
};
