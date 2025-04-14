// @ts-ignore
import { serve } from "https://deno.land/std/http/server.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

// Use esm.sh for axios and supabase-js compatibility
import axios from "https://esm.sh/axios@1.6.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")!;
const oneSignalApiKey = Deno.env.get("ONESIGNAL_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (_req) => {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 5);
  

  const { data, error } = await supabase
    .from("deadlines")
    .select(`
      id,
      deadline,
      notified,
      nodes (
        heading,
        traces (
          title,
          user_id,
          user_profile (
            onesignal_id
          )
        )
      )
    `)
    .eq("notified", false)
    .lte("deadline", soon.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const notifications = data.filter((d) =>
    d.nodes?.traces?.user_profile?.onesignal_id
  );

  for (const item of notifications) {
    const userOneSignalId = item.nodes.traces.user_profile.onesignal_id;
    const title = item.nodes.heading || "Deadline Reminder";
    const body = `🧠 ${item.nodes.traces.title} is due on ${new Date(item.deadline).toLocaleString()}`;

    try {
      await axios.post(
        "https://onesignal.com/api/v1/notifications",
        {
          app_id: oneSignalAppId,
          include_player_ids: [userOneSignalId],
          headings: { en: title },
          contents: { en: body },
        },
        {
          headers: {
            Authorization: `Basic ${oneSignalApiKey}`,
            "Content-Type": "application/json",
          }
        }
      );

      await supabase
        .from("deadlines")
        .update({ notified: true })
        .eq("id", item.id);
    } catch (err) {
      console.error("Notification failed", err);
    }
  }

  return new Response(JSON.stringify({ sent: notifications.length }));
});
