// src/pages/SignInPage.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // on sign-in success, the useAppUser hook will fetch the app row.
    // Optionally, redirect to dashboard (use router instead of location)
    window.location.assign('/');
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const uid = (data as any)?.user?.id;
    if (uid) {
      // create app user and citizen rows immediately (atomic)
      await supabase.from('users').insert([{
        user_id: uid,
        email_id: email,
        username: email.split('@')[0],
        isEmployee: false
      }]).catch((e) => console.warn('create users row error', e));

      await supabase.from('citizen').insert([{
        user_id: uid
      }]).catch(() => {});

      // now redirect to homepage / dashboard
      window.location.assign('/');
    } else {
      setLoading(false);
      alert('Sign up succeeded but no user id returned.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 w-full max-w-md">
        <h1 className="text-2xl mb-4">Sign in / Sign up</h1>
        <form onSubmit={handleSignIn} className="space-y-3">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" />
          <div className="flex gap-2">
            <button disabled={loading} type="submit">Sign In</button>
            <button disabled={loading} onClick={handleSignUp} type="button">Create account</button>
          </div>
        </form>
      </div>
    </div>
  );
}
