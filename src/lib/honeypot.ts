/**
 * The name of the bait field public forms carry. Only a bot fills it, so the
 * server drops any submission where it is not empty — **with the same answer
 * as a success**, so the bot does not learn to get around it.
 *
 * It lives outside any component so a server layer can import the same name,
 * and the rule stays one.
 */
export const HONEYPOT_FIELD = "website";
