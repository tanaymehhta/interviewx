import { z } from "zod";
import { ChatAction } from "@/lib/schemas";

/** Input of the chat tool `suggest_actions`. The tool has no execute function and no side effects: the UI draws buttons. */
export const SuggestActions = z.object({
  actions: z.array(ChatAction.extend({
    round_id: z.string().nullable().describe("Id of the round the button opens, copied from the data. Null for the focus round."),
  })).describe("1 to 3 buttons"),
});
export type SuggestedAction = z.infer<typeof SuggestActions>["actions"][number];
