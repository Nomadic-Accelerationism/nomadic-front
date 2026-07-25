import { redirect } from "next/navigation";

/**
 * Compatibility route: legacy links used /home-user as the post-login home.
 * P0 authenticated home is the Passport.
 */
export default function HomeUser() {
  redirect("/passport");
}
