import { createClient } from "@supabase/supabase-js";

function requiredEnvironment(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for private media storage.`);
  }

  return value;
}

export function getPrivateStorageClient() {
  return createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function getMediaBucket() {
  return process.env.SUPABASE_MEDIA_BUCKET ?? "private-media";
}
