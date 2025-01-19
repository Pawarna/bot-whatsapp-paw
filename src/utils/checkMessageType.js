const getMessageType = (m) => {
    let mimeType;
    const message = m.message;
    if (message?.imageMessage){
        mimeType = message.imageMessage?.mimetype
    } else if (message?.documentMessage || message?.documentWithCaptionMessage){
        mimeType = message.documentMessage?.mimetype || message?.documentWithCaptionMessage.message.documentMessage.mimetype;
    } else if (message?.videoMessage){
        mimeType = message.videoMessage?.mimetype
    }
    
    if (mimeType){
        return mimeType
    }
    return null;
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
    }

    return caption;
}

module.exports = {
    getMessageType,
    getCaptionMessage
}