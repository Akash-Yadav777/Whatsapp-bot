import baileys from '@whiskeysockets/baileys';
import fs from 'fs';
import qrcode from 'qrcode-terminal';

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = baileys;

async function startSock() {
  // Auth state को file से load या new create करें
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp');
      startMessageLoop(sock);
    }
  });
}

function startMessageLoop(sock) {
  const numbers = ['918471090071'];

  const messageText = 'Hello! This is a repeated message using Baileys 🤖';

  let counter = 0;

  setInterval(async () => {
    console.log(`🔁 Sending batch ${++counter}...`);
    for (const number of numbers) {
      const jid = number + '@s.whatsapp.net';
      try {
        await sock.sendMessage(jid, { text: messageText });
        console.log(`📨 Message sent to: ${jid}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${jid}:`, err);
      }
    }
  }, 10000);
}

startSock();
