import type { LucideIcon } from "lucide-react";
import { Calendar, Clock, CreditCard, Globe, House, Lock, Mail, MapPin, MessageCircle, Phone, Search, Store, User } from "lucide-react";

/**
 * The field-icon dictionary: **one kind of data, one icon, for the whole
 * product.**
 *
 * **Closed on purpose.** A field receives the key, never the icon component:
 * if every screen picked its own, "phone" would be a handset on one and a
 * mobile on another, and the icon would stop being recognition and become
 * decoration.
 *
 * **A field without a clear match gets no icon.** An invite code or an "About"
 * text has no object that reads at a glance, and a forced icon — some generic
 * document — is worse than none. A new key enters when an object appears that
 * is recognized at a glance.
 */
export const FIELD_ICONS = {
  name: User,
  business: Store,
  email: Mail,
  phone: Phone,
  message: MessageCircle,
  password: Lock,
  zip: MapPin,
  address: House,
  website: Globe,
  search: Search,
  date: Calendar,
  time: Clock,
  card: CreditCard,
} as const satisfies Record<string, LucideIcon>;

export type FieldIcon = keyof typeof FIELD_ICONS;
