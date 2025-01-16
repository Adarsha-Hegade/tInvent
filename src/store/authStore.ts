import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Admin, User } from '../types';

interface AuthState {
  user: Admin | User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select()
      .eq('email', email)
      .single();

    if (adminData) {
      set({ user: adminData, isAdmin: true });
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (userData) {
      set({ user: userData, isAdmin: false });
      return;
    }

    throw new Error('Invalid credentials');
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));