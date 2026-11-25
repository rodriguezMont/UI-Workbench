import { enUS } from "./en-US";

/** The shape every locale file must match: the en-US keys, any string values. */
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type Messages = Widen<typeof enUS>;

/** The active messages. Only en-US exists today; there is no locale switch. */
export const messages: Messages = enUS;
