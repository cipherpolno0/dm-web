import { serve } from "inngest/next";

import {
  deliverPublishedResultNotifications,
  retryFailedResultNotifications,
} from "@/lib/jobs/functions";
import { inngest } from "@/lib/jobs/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [deliverPublishedResultNotifications, retryFailedResultNotifications],
});
