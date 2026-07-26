import { redirect } from "next/navigation";

/**
 * Compatibility route: legacy links used /home-user as the post-login home.
 * Product home is Explore.
 */
export default function HomeUser() {
  redirect("/explore");
}
