import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "dhammastudy-exam" });

export type ResultPublicationEvent = Readonly<{
  name: "exam/results.published";
  data: {
    publicationId: string;
    notificationJobIds: string[];
  };
}>;

export async function triggerResultNotifications(event: ResultPublicationEvent) {
  try {
    await inngest.send(event);
  } catch {
    // Jobs remain PENDING and will be collected by the scheduled retry function.
    console.error("Unable to trigger result notification event");
  }
}
