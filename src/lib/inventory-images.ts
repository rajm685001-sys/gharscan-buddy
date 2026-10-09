import { createClient } from "@/lib/supabase/client";

export async function getInventoryImageUrl(
  imagePath: string | null,
): Promise<string | null> {
  if (!imagePath) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("inventory-images")
    .createSignedUrl(imagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}