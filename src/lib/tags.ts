import { supabase } from "@/lib/supabase";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
};

export type ContentType = "post" | "tutorial" | "music" | "file";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function searchTags(query: string): Promise<Tag[]> {
  const { data } = await supabase
    .from("tags")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("usage_count", { ascending: false })
    .order("name")
    .limit(50);
  return data ?? [];
}

export async function getAllTags(): Promise<Tag[]> {
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("usage_count", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function getContentTags(contentType: ContentType, contentId: string): Promise<string[]> {
  const { data } = await supabase
    .from("content_tags")
    .select("tags(name)")
    .eq("content_type", contentType)
    .eq("content_id", contentId);
  return (data ?? []).map((row: any) => row.tags?.name).filter(Boolean);
}

export async function createTag(name: string): Promise<Tag | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  // Try insert, on conflict return existing
  const { data: existing } = await supabase
    .from("tags")
    .select("*")
    .ilike("name", trimmed)
    .single();
  if (existing) return existing;
  const { data } = await supabase
    .from("tags")
    .insert({ name: trimmed, slug: slugify(trimmed) })
    .select()
    .single();
  return data;
}

export async function updateContentTags(
  contentType: ContentType,
  contentId: string,
  tagNames: string[]
): Promise<void> {
  // Delete existing
  await supabase
    .from("content_tags")
    .delete()
    .eq("content_type", contentType)
    .eq("content_id", contentId);

  if (tagNames.length === 0) return;

  // Ensure all tags exist, create if not
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const tag = await createTag(name);
    if (tag) tagIds.push(tag.id);
  }

  // Insert junction rows
  await supabase.from("content_tags").insert(
    tagIds.map((tag_id) => ({ content_type: contentType, content_id: contentId, tag_id }))
  );
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function searchCategories(query: string): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("usage_count", { ascending: false })
    .order("name")
    .limit(50);
  return data ?? [];
}

export async function getAllCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("usage_count", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function getContentCategories(contentType: ContentType, contentId: string): Promise<string[]> {
  const { data } = await supabase
    .from("content_categories")
    .select("categories(name)")
    .eq("content_type", contentType)
    .eq("content_id", contentId);
  return (data ?? []).map((row: any) => row.categories?.name).filter(Boolean);
}

export async function createCategory(name: string): Promise<Category | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", trimmed)
    .single();
  if (existing) return existing;
  const { data } = await supabase
    .from("categories")
    .insert({ name: trimmed, slug: slugify(trimmed) })
    .select()
    .single();
  return data;
}

export async function updateContentCategories(
  contentType: ContentType,
  contentId: string,
  categoryNames: string[]
): Promise<void> {
  // Delete existing
  await supabase
    .from("content_categories")
    .delete()
    .eq("content_type", contentType)
    .eq("content_id", contentId);

  if (categoryNames.length === 0) return;

  // Ensure all categories exist, create if not
  const categoryIds: string[] = [];
  for (const name of categoryNames) {
    const cat = await createCategory(name);
    if (cat) categoryIds.push(cat.id);
  }

  // Insert junction rows
  await supabase.from("content_categories").insert(
    categoryIds.map((category_id) => ({ content_type: contentType, content_id: contentId, category_id }))
  );
}
