// ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getStoredKeypair, decryptFrom } from '../crypto';
import MessageInput from './MessageInput';

export default function ChatWindow({ chatId, other, me, wsClient }) {
  const [messages, setMessages] = useState([]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!chatId) return;
    mounted.current = true;

    // fetch last 50 messages
    async function load() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) console.error('fetch messages', error);
      else {
        // decrypt messages where possible
        const kp = await getStoredKeypair();
        const arr = [];
        for (const m of data) {
          let text = null;
          if (m.sender_pubkey && kp && kp.privateKey) {
            text = await decryptFrom(m.sender_pubkey, m.ciphertext, m.nonce, kp.privateKey);
          }
          arr.push({ ...m, text });
        }
        setMessages(arr);
      }
    }

    load();

    // subscribe via wsClient
    if (wsClient) {
      wsClient.subscribe(chatId);
      const off = wsClient.onMessage(async (msg) => {
        if (msg.type === 'message' && msg.chat_id === chatId) {
          // attempt decrypt
          const kp = await getStoredKeypair();
          let text = null;
          if (kp && kp.privateKey && msg.sender_pubkey && msg.ciphertext && msg.nonce) {
            text = await decryptFrom(msg.sender_pubkey, msg.ciphertext, msg.nonce, kp.privateKey);
          }
          setMessages(prev => [...prev, { ...msg, text }]);
        }
      });
      return () => {
        off();
      };
    }

    return () => { mounted.current = false; };

  }, [chatId, wsClient]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
        {messages.map(m => (
          <div key={m.id || Math.random()} style={{ margin: 6, textAlign: m.sender === me.id ? 'right' : 'left' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{m.sender}</div>
            <div style={{ background: m.sender === me.id ? '#cfe9ff' : '#f2f2f2', display: 'inline-block', padding: 8 }}>
              {m.text ?? '🔒 Encrypted message (could not decrypt)'}
            </div>
          </div>
        ))}
      </div>
      <MessageInput chatId={chatId} other={other} me={me} wsClient={wsClient} />
    </div>
  );
}