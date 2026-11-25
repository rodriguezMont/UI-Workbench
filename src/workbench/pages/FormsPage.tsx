import { useState } from "react";

import { Field } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import { MaskedField } from "@/components/ui/masked-field";
import { PhoneField } from "@/components/ui/masked-field/phone-field";
import { PasswordField } from "@/components/ui/password-field";
import { Select } from "@/components/ui/select";
import { messages } from "@/messages";

import { Piece, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

const toOptions = (labels: readonly string[]) => labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

/** The value that would be submitted, written under the piece. */
function Submitted({ value }: { value: string }) {
  return (
    <p className="w-full text-xs text-secondary">
      {t.masked.submitted}: <code className="font-mono text-primary">{value || t.masked.nothing}</code>
    </p>
  );
}

function PhoneDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <PhoneField label={t.masked.intlLabel} hint={t.masked.intlHint} onValueChange={setValue} />
      <Submitted value={value} />
    </div>
  );
}

export function FormsPage() {
  return (
    <SectionPage id="forms">
      <Piece id="field">
        <State label={t.field.plain} note={t.field.plainNote}>
          <Field label={t.field.name} hint={t.field.nameHint} autoComplete="name" />
        </State>
        <State label={t.field.icon} note={t.field.iconNote}>
          <Field label={t.field.email} icon="email" type="email" placeholder={t.field.emailPlaceholder} autoComplete="email" />
        </State>
        <State label={t.field.error} note={t.field.errorNote}>
          <Field label={t.field.email} icon="email" type="email" defaultValue="name.example.com" error={t.field.emailError} />
        </State>
        <State label={t.field.adornments} note={t.field.adornmentsNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.price} prefix="$" inputMode="decimal" defaultValue="49.00" />
            <Field label={t.field.distance} suffix="mi" inputMode="numeric" defaultValue="25" />
          </div>
        </State>
        <State label={t.field.status} note={t.field.statusNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.address} icon="address" status="loading" loadingLabel={t.field.looking} defaultValue="1600 Pennsylvania Ave" />
            <Field label={t.field.verified} icon="website" status="valid" validLabel={t.field.confirmed} defaultValue="example.com" />
          </div>
        </State>
        <State label={t.field.readOnly} note={t.field.readOnlyNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.accountId} readOnly defaultValue={t.field.accountIdValue} />
            <Field label={t.field.plan} disabled defaultValue="Team" hint={t.field.planReason} />
          </div>
        </State>
        <State label={t.field.textarea} note={t.field.textareaNote} wide>
          <Field as="textarea" label={t.field.about} placeholder={t.field.aboutPlaceholder} maxLength={280} />
        </State>
      </Piece>

      <Piece id="fieldset">
        <State label={t.fieldset.label} note={t.fieldset.note}>
          <Fieldset legend={t.fieldset.legend} hint={t.fieldset.hint} error={t.fieldset.error}>
            <div className="grid gap-3">
              <Field label={t.fieldset.street} autoComplete="address-line1" />
              <Field label={t.fieldset.city} autoComplete="address-level2" />
            </div>
          </Fieldset>
        </State>
        <State label={t.fieldset.disabled} note={t.fieldset.disabledNote}>
          <Fieldset legend={t.fieldset.lockedLegend} hint={t.fieldset.lockedHint} disabled>
            <div className="grid gap-3">
              <Field label={t.fieldset.street} defaultValue="350 Fifth Avenue" />
              <Field label={t.fieldset.city} defaultValue="New York" />
            </div>
          </Fieldset>
        </State>
      </Piece>

      <Piece id="password-field">
        <State label={t.password.signUp} note={t.password.signUpNote}>
          <PasswordField label={t.password.newPassword} autoComplete="new-password" minLength={8} />
        </State>
        <State label={t.password.signIn}>
          <PasswordField label={t.password.current} autoComplete="current-password" />
        </State>
        <State label={t.password.error} note={t.password.errorNote}>
          <PasswordField label={t.password.newPassword} autoComplete="new-password" minLength={8} defaultValue="abc" error={t.password.tooShort} />
        </State>
      </Piece>

      <Piece id="masked-field">
        <State label={t.masked.zip} note={t.masked.zipNote}>
          <MaskedField mask="zip" label={t.masked.zipLabel} icon="zip" placeholder="90210" />
        </State>
        <State label={t.masked.phone} note={t.masked.phoneNote}>
          <MaskedField mask="phone" label={t.masked.phoneLabel} icon="phone" placeholder="(213) 373-4253" />
        </State>
        <State label={t.masked.date} note={t.masked.dateNote}>
          <MaskedField mask="date" label={t.masked.dateLabel} icon="date" placeholder="MM/DD/YYYY" />
        </State>
        <State label={t.masked.currency} note={t.masked.currencyNote}>
          <MaskedField mask="currency" label={t.masked.priceLabel} prefix="$" placeholder="0.00" />
        </State>
        <State label={t.masked.integer} note={t.masked.integerNote}>
          <MaskedField mask="integer" label={t.masked.seatsLabel} suffix={t.masked.seatsSuffix} defaultValue="1500" />
        </State>
        <State label={t.masked.international} note={t.masked.internationalNote}>
          <PhoneDemo />
        </State>
      </Piece>

      <Piece id="select">
        <State label={t.select.single} note={t.select.singleNote}>
          <Select label={t.select.plan} options={t.select.planOptions} defaultValue="team" />
        </State>
        <State label={t.select.search} note={t.select.searchNote}>
          <Select
            label={t.select.timezone}
            icon="time"
            searchable
            searchPlaceholder={t.select.timezoneSearch}
            options={toOptions(t.select.timezoneOptions)}
          />
        </State>
        <State label={t.select.multiple} note={t.select.multipleNote}>
          <Select multiple label={t.select.services} options={toOptions(t.select.serviceOptions)} defaultValue={["oil-change", "tires"]} />
        </State>
        <State label={t.select.error} note={t.select.errorNote}>
          <Select label={t.select.role} options={toOptions(t.select.roleOptions)} error={t.select.roleError} />
        </State>
      </Piece>
    </SectionPage>
  );
}
