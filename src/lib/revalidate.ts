import { revalidatePath } from "next/cache";

/** Revalidate the home page and the given hero pages. */
export function revalidateHeroes(slugs: string[]) {
  revalidatePath("/");
  for (const slug of new Set(slugs)) revalidatePath(`/hero/${slug}`);
}

/** Revalidate every public page (home + all hero pages). */
export function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/hero/[slug]", "page");
}
