import { supabase } from './supabase';
import { Profile } from './types';
import type { Currency } from './contexts/CurrencyContext';

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

export async function getUserPermissions(userId: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('feature, can_access')
    .eq('user_id', userId);

  const permissions: Record<string, boolean> = {};
  if (data && !error) {
    data.forEach((perm) => {
      permissions[perm.feature] = perm.can_access;
    });
  }
  return permissions;
}

export async function hasPermission(userId: string, feature: string): Promise<boolean> {
  const isUserAdmin = await isAdmin(userId);
  if (isUserAdmin) return true; // Admins have all permissions

  const permissions = await getUserPermissions(userId);
  return permissions[feature] === true;
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export function formatCurrency(amount: number, currency?: Currency | string): string {
  if (!currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  if (typeof currency === 'string') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Use currency object
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${currency.symbol}${formatted}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
