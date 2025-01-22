const getMessageType = (m) => {
    let mimeType;
    const message = m.message;
    if (message?.imageMessage){
        mimeType = message.imageMessage?.mimetype
    } else if (message?.documentMessage || message?.documentWithCaptionMessage){
        mimeType = message.documentMessage?.mimetype || message?.documentWithCaptionMessage.message.documentMessage.mimetype;
    } else if (message?.videoMessage){
        mimeType = message.videoMessage?.mimetype;
    } else if (message?.stickerMessage){
        mimeType = message.stickerMessage.mimetype;
    } else if (message?.audioMessage){
        mimeType = message.audioMessage.mimetype;
    }
    
    if (mimeType){
        return mimeType
    }
    return false;
}

const getCaptionMessage = (m) => {
    let caption;
    const message = m.message;
    if (message.imageMessage){
        caption = message.imageMessage.caption;
    } else if (message.documentMessage){
        caption = message.documentMessage.caption;
    } else if (message.documentWithCaptionMessage){
        caption = message.documentWithCaptionMessage.message.documentMessage.caption;
    } else if (message.videoMessage){
        caption = message.videoMessage.caption;
    } else if (message.stickerMessage){
        caption = "berikan reaksi yang sesuai terhadap stiker yang diberikan. Reaksi harus relevan dengan topik atau suasana percakapan sebelumnya, serta mencerminkan emosi atau maksud dari stiker tersebut."
    } else if (message?.audioMessage){
        caption = "Dengarkan suara ini dan berikan tanggapan berdasarkan history percakapan"
    }

    return caption;
}

module.exports = {
    getMessageType,
    getCaptionMessage
}