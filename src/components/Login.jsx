// Login.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateAndStoreKeypair, getStoredKeypair } from '../crypto';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function signUp() {
    // create supabase auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    // generate keypair and store locally then upsert public_key to profiles
    const kp = await generateAndStoreKeypair();
    // wait for confirmation or immediate upsert (user will be created)
    // after signUp, user might need to confirm email depending on your supabase settings
    // we upsert profile when user signs in below
    alert('Signup successful — please check your email if confirmation required. Now sign in.');
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    // ensure keypair exists; if not generate
    let kp = await getStoredKeypair();
    if (!kp) kp = await generateAndStoreKeypair();
    // upsert profile (public_key) using Supabase client authenticated session
    const user = data.user;
    if (!user) {
      alert('No user returned');
      return;
    }
    const publicKey = kp.publicKey;
    const r = await supabase.from('profiles').upsert({ id: user.id, username: email.split('@')[0], public_key: publicKey });
    if (r.error) {
      console.error('profile upsert error', r.error);
    }
    // hand control to parent
    onLogin(user);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>WayChat — Login / Signup</h2>
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <br />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={signIn}>Sign in</button>
      <button onClick={signUp}>Sign up</button>
    </div>
  );
}