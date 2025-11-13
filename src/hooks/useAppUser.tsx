// src/hooks/useAppUser.tsx
import { useEffect, useState } from 'react';
import { supabase, getAuthUserId } from '../lib/supabaseClient';

export type AppUser = {
  user_id: string;
  email_id?: string;
  username?: string;
  isEmployee?: boolean;
  citizen?: any | null;
  employee?: any | null;
};

export function useAppUser() {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function ensureAppUserExists(authId: string, email?: string) {
      // create users row if missing
      const { data: existingUser, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authId)
        .limit(1)
        .single()
        .catch(() => ({ data: null, error: null }));

      if (!existingUser) {
        // insert a minimal users row and a citizen row (so UI can render)
        await supabase.from('users').insert([{
          user_id: authId,
          email_id: email ?? null,
          username: email ? email.split('@')[0] : null,
          isEmployee: false,
        }]).catch((e) => console.warn('users insert error', e));

        await supabase.from('citizen').insert([{
          user_id: authId,
          contact_no: null,
          house_no: null,
          street: null,
          landmark: null,
          city: null,
          NagarNigam_wardno: null,
          state: null,
          pincode: null
        }]).catch(() => {});
      }
    }

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const authUser = (authData as any)?.user;
      if (!authUser) {
        if (mounted) {
          setAppUser(null);
          setLoading(false);
        }
        return;
      }

      const id = authUser.id;
      const email = (authUser as any).email ?? undefined;

      // try to ensure an app users row exists (client-side fallback)
      await ensureAppUserExists(id, email);

      // fetch the app-level users row
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', id)
        .limit(1)
        .single()
        .catch((e) => ({ data: null, error: e }));

      if (userErr) {
        setError('Failed to load user profile');
        console.error('fetch users error', userErr);
      }

      if (!userRow) {
        if (mounted) {
          setAppUser(null);
          setLoading(false);
        }
        return;
      }

      // coerce isEmployee to boolean and normalize
      const normalized = {
        ...userRow,
        isEmployee: !!(userRow.isEmployee === true || userRow.isEmployee === 'true' || userRow.isEmployee === 1),
      };

      // fetch specialization row
      if (!normalized.isEmployee) {
        const { data: citizenRow } = await supabase.from('citizen')
          .select('*')
          .eq('user_id', id)
          .limit(1)
          .single()
          .catch(() => ({ data: null }));
        if (mounted) setAppUser({ ...normalized, citizen: citizenRow ?? null });
      } else {
        const { data: empRow } = await supabase.from('employee')
          .select('*')
          .eq('user_id', id)
          .limit(1)
          .single()
          .catch(() => ({ data: null }));
        if (mounted) setAppUser({ ...normalized, employee: empRow ?? null });
      }

      if (mounted) setLoading(false);
    }

    load();

    const { subscription } = supabase.auth.onAuthStateChange((_event, _session) => {
      load();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { appUser, loading, error };
}
