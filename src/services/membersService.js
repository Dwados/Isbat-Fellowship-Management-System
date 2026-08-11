import { supabase } from '../lib/supabase';
import { normalizePhone } from '../utils/phone';

export async function findMemberByPhone(phone) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', normalizePhone(phone))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMembers(search = '') {
  const q = search.trim().replace(/[%,()]/g, '');
  let query = supabase.from('members').select('*').order('name', { ascending: true });
  if (q) query = query.or('name.ilike.%' + q + '%,phone.ilike.%' + q + '%');
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMember({ name, phone, email, course }) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email?.trim() || null,
      course: course?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function countMembers() {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function countNewMembersSince(isoDateTime) {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDateTime);
  if (error) throw error;
  return count ?? 0;
}
