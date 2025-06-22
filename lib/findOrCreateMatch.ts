import { supabase } from './supabase';

export async function findOrCreateMatch(mode: 'freestyle' | 'longform') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const myId = user.id;

  // Try to find someone else waiting
  const { data: match } = await supabase
    .from('queue')
    .select('user_id')
    .neq('user_id', myId)
    .eq('mode', mode)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (match?.user_id) {
    // Found a match — remove both from queue
    await supabase.from('queue').delete().eq('user_id', match.user_id);
    return match.user_id;
  } else {
    // No match — insert self into queue
    await supabase.from('queue').insert({ user_id: myId, mode });
    return null; // Wait for opponent
  }
}
