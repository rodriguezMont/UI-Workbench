import { enUS } from "./en-US";

/**
 * The shape every locale must match: the en-US keys, with any string values
 * and the same message functions (for copy with a value inside it).
 */
type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: never[]) => unknown
      ? T[K]
      : Widen<T[K]>;
};

export type Messages = Widen<typeof enUS>;

/** The active locale, for `Intl` formatting next to the copy. */
export const locale = "en-US";

/** The active messages. Only en-US exists today; there is no locale switch. */
export const messages: Messages = enUS;
