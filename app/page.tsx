import Survey from "./survey";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let submissionsOpen = false;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("event_settings")
      .select("submissions_open")
      .eq("id", true)
      .single();

    if (error) throw error;
    submissionsOpen = data.submissions_open;
  } catch (error) {
    console.error("Failed to load submission status", error);
  }

  return <Survey submissionsOpen={submissionsOpen} />;
}
