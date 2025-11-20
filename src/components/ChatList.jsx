// ChatList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChatList({ onSelectChat, me }) {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    // load profiles (public keys)
    async function load() {
      const { data, error } = await supabase.from('profiles').select('id, username, public_key').limit(100);
      if (error) console.error(error);
      else setContacts(data.filter(p => p.id !== me.id));
    }
    load();
  }, [me]);

  return (
    <div style={{ width: 250, borderRight: '1px solid #ddd', padding: 10 }}>
      <h3>Contacts</h3>
      {contacts.map(c => (
        <div key={c.id} style={{ margin: 8, cursor: 'pointer' }} onClick={() => onSelectChat(`dm:${[me.id, c.id].sort().join(':')}`, c)}>
          <strong>{c.username || c.id.slice(0,6)}</strong>
          <div style={{ fontSize: 12 }}>{c.public_key ? 'E2EE' : 'no key'}</div>
        </div>
      ))}
    </div>
  );
}