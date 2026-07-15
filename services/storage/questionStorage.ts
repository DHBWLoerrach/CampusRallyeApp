import { supabase } from '@/utils/Supabase';

/** Resolves the public URL for a question picture stored in the `question-pictures` bucket. */
export function getQuestionPictureUrl(
  bucketPath: string | null | undefined
): string | null {
  if (!bucketPath) return null;
  const result = supabase.storage
    .from('question-pictures')
    .getPublicUrl(bucketPath);
  return result?.data?.publicUrl ?? null;
}
