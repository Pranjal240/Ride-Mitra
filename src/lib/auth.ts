import { supabase } from './supabase';
import type { User } from '../types';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim());

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return profile;
}

export async function createOrUpdateProfile(
  userId: string,
  email: string,
  fullName: string | null,
  userType: string
): Promise<User> {
  // Check if admin
  const isAdmin = ADMIN_EMAILS.includes(email);
  const finalType = isAdmin ? 'admin' : userType;

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      user_type: finalType,
      profile_complete: fullName ? 25 : 0,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}
