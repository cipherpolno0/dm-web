import { inngest } from "@/lib/jobs/inngest";
import {
  processDueResultNotificationJobs,
  processResultNotificationJob,
} from "@/lib/jobs/result-notifications";

export const deliverPublishedResultNotifications = inngest.createFunction(
  { id: "deliver-published-result-notifications", retries: 0 },
  { event: "exam/results.published" },
  async ({ event, step }) => {
    for (const jobId of event.data.notificationJobIds) {
      await step.run(`send-${jobId}`, () => processResultNotificationJob(jobId));
    }
  },
);

export const retryFailedResultNotifications = inngest.createFunction(
  { id: "retry-failed-result-notifications", retries: 0 },
  { cron: "*/10 * * * *" },
  async () => processDueResultNotificationJobs(),
);
