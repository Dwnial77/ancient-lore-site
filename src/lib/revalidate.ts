import { revalidatePath } from "next/cache";

/** Revalidate the home page and the given hero / topic pages. */
export function revalidateHeroes(slugs: string[], topicSlugs: string[] = []) {
  revalidatePath("/");
  for (const slug of new Set(slugs)) revalidatePath(`/hero/${slug}`);
  for (const slug of new Set(topicSlugs)) revalidatePath(`/lore/${slug}`);
}

/** Revalidate every public page (home, all hero pages, all topic pages). */
export function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/hero/[slug]", "page");
  revalidatePath("/lore/[slug]", "page");
}
