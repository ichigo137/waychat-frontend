// MessageInput.jsx
import React, { useState } from 'react';
import { getStoredKeypair, encryptFor } from '../crypto';
import { supabase } from '../supabaseClient';

export default function MessageInput({ chatId, other, me, wsClient }) {
  const [text, setText] = useState('');
  if (!chatId) return null;

  async function send() {
    if (!text) return;
    // fetch recipient public key (we have 'other' with public_key)
    const recipientPub = other.public_key;
    const kp = await getStoredKeypair();
    if (!kp || !recipientPub) {
      alert('Missing keys');
      return;
    }
    // encrypt message using recipient public key and our private key
    const res = await encryptFor(recipientPub, text, kp.privateKey);
    // payload matching server expectations
    const payload = {
      type: 'message',
      chat_id: chatId,
      ciphertext: res.ciphertext,
      nonce: res.nonce,
      sender_pubkey: kp.publicKey,
      metadata: { text_length: text.length }
    };
    // send over WebSocket (server will insert to DB and broadcast)
    wsClient.sendMessage(payload);
    setText('');
  }

  return (
    <div style={{ padding: 8 }}>
      <input style={{ width: '80%' }} value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}