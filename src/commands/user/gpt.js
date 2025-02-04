module.exports = {
    name: 'gpt',
    description: 'Bertanya pada gpt-4-turbo',
    execute: async ({args}) => {
        const message = args.join(' ');

        if (!message){
            return {
                type: 'text',
                content: '⚠ Harap masukkan pertanyaan. Contoh /gpt apa kabar?'
            }
        }

        const headersList = { 
            "Accept": "application/json",
            "Content-Type": "application/json"
         };

        const payload = {
            "messages":[
                {
                    "role": "system",
                    "content": "Berikan balasan dan format chat whatsapp"
                },
                {
                    "role":"user",
                    "content":`${message}`
                }
            ]
        };

        const requestOptions = { method: "POST", headers: headersList, body: JSON.stringify(payload) };

        try {
            const response = await fetch("https://api.zpi.my.id/v1/ai/gpt-4-turbo", requestOptions);
            
            if(!response.ok){
                 const errorData = await response.json();
                 throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
            }
            
            const responseData = await response.json();

            if (!responseData || !responseData.data || !responseData.data.choices || !responseData.data.choices.content) {
                 return {
                    type: 'text',
                    content: "❌ Gagal mendapatkan respon yang valid dari GPT"
                }
              }


            return {
                type: 'text',
                content: responseData.data.choices.content
            }

        } catch (error) {
            console.error("Error fetch:", error);
            return {
                type: 'text',
                content: `❌ Terjadi kesalahan saat menghubungi server`
            }
        }
    }
}