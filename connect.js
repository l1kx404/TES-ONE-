const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')

// GANTI NOMOR LU DISINI! PAKE 62!
const PAIRING_NUMBER = "6285718067039"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    sock.ev.on('creds.update', saveCreds)

    // MINTA PAIRING CODE
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(PAIRING_NUMBER)
                console.log(`\nCODE LU: ${code} <- MASUKIN DI WA BEH!\n`)
            } catch(e){ console.log("Gagal minta code:", e) }
        }, 3000)
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom && lastDisconnect.error.output.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('TES-ONE CONNECTED BEH! ✅')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const from = m.key.remoteJid

        // === TAMPILAN BOT AWAL NYE BEH (GANTI DISINI) ===
        if(text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
            let menu = `*TES-ONE BOT AKTIF BEH* ✅

╭─ *MENU UTAMA*
│ •.ping - cek bot
│ •.menu - menu ini
│ •.owner - info owner
╰────────────────

Ketik.ping buat tes beh!`
            await sock.sendMessage(from, { text: menu })
        }

        if(text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: 'Pong! Bot aktif beh ✅ Speed: ' + new Date().toLocaleString() })
        }

        if(text.toLowerCase() === '.owner') {
            await sock.sendMessage(from, { text: 'Owner: TES-ONE\nWA: wa.me/628xxxx' })
        }
    })
}

startBot()
