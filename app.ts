import makeWASocket, { DisconnectReason, useSingleFileAuthState } from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp () {
    const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2))
        const msg = m.messages[0]
        const msgText = msg.message?.conversation
        console.log('replying to', m.messages[0].key.remoteJid)
        if(!msg.key.fromMe) {
            if(m.type === 'notify') {
                if(msgText) {
                    await sock.sendMessage(m.messages[0].key.remoteJid!, { text: `vc digitou ${msgText}` })
                }
            }
        }
    })
    sock.ev.on('creds.update', saveState)
}

connectToWhatsApp()