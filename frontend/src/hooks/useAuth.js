import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Initialize Supabase Auth
    // import { createClient } from '@supabase/supabase-js';
    // const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
    // supabase.auth.onAuthStateChange((event, session) => {
    //   setUser(session?.user ?? null);
    //   setLoading(false);
    // });

    // Mock user for development
    const mockUser = {
      id: '123',
      email: 'demo@dumroo.ai',
      user_metadata: { name: 'Demo User' },
    };
    setUser(mockUser);
    setLoading(false);
  }, []);

  async function logout() {
    // TODO: Implement Supabase logout
    setUser(null);
  }

  return { user, loading, logout };
}
