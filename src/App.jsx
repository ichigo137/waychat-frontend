import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import WSClient from './wsClient';
import { supabase } from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedOther, setSelectedOther] = useState(null);
  const [wsClient, setWsClient] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
    // auth state listener
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUser(session.user);
      if (!session) setUser(null);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      if (wsClient) {
        // close if exists
        try { wsClient.ws && wsClient.ws.close(); } catch {}
        setWsClient(null);
      }
      return;
    }
    // connect WebSocket with access token
    const token = supabase.auth.getSession().then(({ data }) => {
      const access = data.session?.access_token;
      if (!access) return;
      const url = import.meta.env.VITE_WS_URL;
      const client = new WSClient(url);
      client.connect(access);
      setWsClient(client);
    });
  }, [user]);

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ChatList me={user} onSelectChat={(chat_id, other) => { setSelectedChat(chat_id); setSelectedOther(other); }} />
      <div style={{ flex: 1 }}>
        <div style={{ padding: 10, borderBottom: '1px solid #eee' }}>
          Logged in as {user.email || user.id} <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
        <ChatWindow chatId={selectedChat} other={selectedOther} me={user} wsClient={wsClient} />
      </div>
    </div>
  );
}
