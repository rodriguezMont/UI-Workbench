import { useState } from "react";
import { DatabaseBackup, Globe, Headset, LayoutGrid, List, ZoomIn, ZoomOut } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { CheckboxList } from "@/components/ui/checkbox-list";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Field } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import { TextLink } from "@/components/ui/link";
import { MaskedField } from "@/components/ui/masked-field";
import { PhoneField } from "@/components/ui/masked-field/phone-field";
import { PasswordField } from "@/components/ui/password-field";
import { PhotoGallery } from "@/components/ui/photo-gallery";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { ProfileCover } from "@/components/ui/profile-cover";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { RatingInput } from "@/components/ui/rating-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch, useSwitchSave } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { dateToIso } from "@/lib/date-time";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SAMPLE_COVER, SAMPLE_LOGO, SAMPLE_PHOTOS } from "../samples";
import { SectionPage } from "./SectionPage";
import { CardFormDemo, FileRowsDemo, FileUploadDemo, ImageCropperDemo } from "./file-demos";

const t = messages.workbench.demos;

const toOptions = (labels: readonly string[]) => labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

/** The value that would be submitted, written under the piece. */
function Submitted({ value, empty = t.masked.nothing }: { value: string; empty?: string }) {
  return (
    <p className="w-full text-xs text-secondary">
      {t.masked.submitted}: <code className="font-mono text-primary">{value || empty}</code>
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

/** The parent box sums up its children: checked, unchecked or "some". */
function IndeterminateDemo() {
  const items = t.checkbox.notifications;
  const [on, setOn] = useState<readonly string[]>([items[0]!]);
  const all = on.length === items.length;
  return (
    <div className="w-full">
      <Checkbox
        label={t.checkbox.allNotifications}
        checked={all}
        indeterminate={on.length > 0 && !all}
        onChange={() => setOn(all ? [] : items)}
      />
      <div className="pl-8">
        {items.map((item) => (
          <Checkbox
            key={item}
            label={item}
            checked={on.includes(item)}
            onChange={() => setOn((current) => (current.includes(item) ? current.filter((i) => i !== item) : items.filter((i) => i === item || current.includes(i))))}
          />
        ))}
      </div>
    </div>
  );
}

/** A pretend server: answers after a moment, or fails on purpose. */
const pretendSave = (fails: boolean) => () =>
  new Promise<void>((resolve, reject) => setTimeout(() => (fails ? reject(new Error("demo")) : resolve()), 900));

function SavingSwitchDemo({ fails }: { fails?: boolean }) {
  const state = useSwitchSave(!fails, pretendSave(Boolean(fails)));
  return fails ? <Switch label={t.switch.digest} hint={t.switch.digestHint} {...state} /> : <Switch label={t.switch.replies} {...state} />;
}

/** A date picker with what it would submit under it. */
function DateDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <DatePicker label={t.datePicker.start} hint={t.datePicker.startHint} onValueChange={setValue} />
      <Submitted value={value} empty={t.datePicker.nothing} />
    </div>
  );
}

/** Bounds relative to today, so the demo never goes stale. */
function BoundedDateDemo() {
  const [bounds] = useState(() => {
    const today = new Date();
    const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
    return { min: dateToIso(today), max: dateToIso(last) };
  });
  return <DatePicker label={t.datePicker.delivery} hint={t.datePicker.deliveryHint} {...bounds} />;
}

function TimeDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <TimePicker label={t.timePicker.pickup} onValueChange={setValue} />
      <Submitted value={value} empty={t.timePicker.nothing} />
    </div>
  );
}

function DateTimeDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <DateTimePicker label={t.dateTimePicker.starts} hint={t.dateTimePicker.startsHint} onValueChange={setValue} />
      <Submitted value={value} empty={t.dateTimePicker.nothing} />
    </div>
  );
}

export function FormsPage() {
  return (
    <SectionPage id="forms">
      <Piece id="field">
        <State label={t.field.plain} note={t.field.plainNote}>
          <Field label={t.field.name} hint={t.field.nameHint} placeholder={t.field.namePlaceholder} autoComplete="name" />
        </State>
        <State label={t.field.icon} note={t.field.iconNote}>
          <Field label={t.field.email} icon="email" type="email" placeholder={t.field.emailPlaceholder} autoComplete="email" />
        </State>
        <State label={t.field.error} note={t.field.errorNote}>
          <Field
            label={t.field.email}
            icon="email"
            type="email"
            placeholder={t.field.emailPlaceholder}
            defaultValue="name.example.com"
            error={t.field.emailError}
          />
        </State>
        <State label={t.field.adornments} note={t.field.adornmentsNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.price} prefix="$" inputMode="decimal" placeholder={t.field.pricePlaceholder} defaultValue="49.00" />
            <Field label={t.field.distance} suffix="mi" inputMode="numeric" placeholder={t.field.distancePlaceholder} defaultValue="25" />
          </div>
        </State>
        <State label={t.field.status} note={t.field.statusNote}>
          {/* Stacked, not paired: the status sits at the field's end, and a
              quarter-width field cut the address off under the spinner. */}
          <div className="grid w-full gap-3">
            <Field
              label={t.field.address}
              icon="address"
              status="loading"
              loadingLabel={t.field.looking}
              placeholder={t.field.addressPlaceholder}
              defaultValue="1600 Pennsylvania Ave"
            />
            <Field
              label={t.field.verified}
              icon="website"
              status="valid"
              validLabel={t.field.confirmed}
              placeholder={t.field.websitePlaceholder}
              defaultValue="example.com"
            />
          </div>
        </State>
        <State label={t.field.readOnly} note={t.field.readOnlyNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.accountId} readOnly placeholder={t.field.accountIdPlaceholder} defaultValue={t.field.accountIdValue} />
            <Field label={t.field.plan} disabled placeholder={t.field.planPlaceholder} defaultValue="Team" hint={t.field.planReason} />
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
              <Field label={t.fieldset.street} placeholder={t.fieldset.streetPlaceholder} autoComplete="address-line1" />
              <Field label={t.fieldset.city} placeholder={t.fieldset.cityPlaceholder} autoComplete="address-level2" />
            </div>
          </Fieldset>
        </State>
        <State label={t.fieldset.disabled} note={t.fieldset.disabledNote}>
          <Fieldset legend={t.fieldset.lockedLegend} hint={t.fieldset.lockedHint} disabled>
            <div className="grid gap-3">
              <Field label={t.fieldset.street} placeholder={t.fieldset.streetPlaceholder} defaultValue="350 Fifth Avenue" />
              <Field label={t.fieldset.city} placeholder={t.fieldset.cityPlaceholder} defaultValue="New York" />
            </div>
          </Fieldset>
        </State>
      </Piece>

      <Piece id="password-field">
        <State label={t.password.signUp} note={t.password.signUpNote}>
          <PasswordField label={t.password.newPassword} placeholder={t.password.placeholder} autoComplete="new-password" minLength={8} />
        </State>
        <State label={t.password.signIn}>
          <PasswordField label={t.password.current} placeholder={t.password.placeholder} autoComplete="current-password" />
        </State>
        <State label={t.password.error} note={t.password.errorNote}>
          <PasswordField
            label={t.password.newPassword}
            placeholder={t.password.placeholder}
            autoComplete="new-password"
            minLength={8}
            defaultValue="abc"
            error={t.password.tooShort}
          />
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
          <MaskedField mask="integer" label={t.masked.seatsLabel} suffix={t.masked.seatsSuffix} placeholder={t.masked.seatsPlaceholder} defaultValue="1500" />
        </State>
        <State label={t.masked.international} note={t.masked.internationalNote} wide>
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

      <Piece id="checkbox">
        <State label={t.checkbox.plain} note={t.checkbox.plainNote}>
          <Checkbox label={t.checkbox.digest} defaultChecked />
        </State>
        <State label={t.checkbox.description} note={t.checkbox.descriptionNote}>
          <Checkbox label={t.checkbox.giftWrap} description={t.checkbox.giftWrapDescription} hint={t.checkbox.giftWrapHint} />
        </State>
        <State label={t.checkbox.link} note={t.checkbox.linkNote}>
          <Checkbox
            label={
              <>
                {t.checkbox.termsBefore}
                <TextLink href="https://example.com" external>
                  {t.checkbox.terms}
                </TextLink>
              </>
            }
          />
        </State>
        <State label={t.checkbox.indeterminate} note={t.checkbox.indeterminateNote}>
          <IndeterminateDemo />
        </State>
        <State label={t.checkbox.error} note={t.checkbox.errorNote}>
          <Checkbox label={t.checkbox.consent} error={t.checkbox.consentError} />
        </State>
      </Piece>

      <Piece id="checkbox-card">
        <State label={t.checkboxCard.label} note={t.checkboxCard.note} wide>
          <Fieldset legend={t.checkboxCard.legend}>
            <div className="grid gap-3 sm:grid-cols-3">
              <CheckboxCard name="addons" value="support" icon={Headset} label={t.checkboxCard.support} description={t.checkboxCard.supportDescription} defaultChecked />
              <CheckboxCard name="addons" value="backups" icon={DatabaseBackup} label={t.checkboxCard.backups} description={t.checkboxCard.backupsDescription} />
              <CheckboxCard name="addons" value="domain" icon={Globe} label={t.checkboxCard.domain} description={t.checkboxCard.domainDescription} disabled />
            </div>
          </Fieldset>
        </State>
        <State label={t.checkboxCard.error} note={t.checkboxCard.errorNote} wide>
          <Fieldset legend={t.checkboxCard.legend} error={t.checkboxCard.errorMessage}>
            <div className="grid gap-3 sm:grid-cols-3">
              <CheckboxCard icon={Headset} label={t.checkboxCard.support} description={t.checkboxCard.supportDescription} />
              <CheckboxCard icon={DatabaseBackup} label={t.checkboxCard.backups} description={t.checkboxCard.backupsDescription} />
            </div>
          </Fieldset>
        </State>
      </Piece>

      <Piece id="checkbox-list">
        <State label={t.checkboxList.search} note={t.checkboxList.searchNote}>
          <CheckboxList
            legend={t.checkboxList.cities}
            name="cities"
            options={toOptions(t.checkboxList.cityOptions)}
            searchable
            searchPlaceholder={t.checkboxList.citySearch}
            collapseAfter={5}
            clearable
            defaultValue={["seattle"]}
          />
        </State>
        <State label={t.checkboxList.limit} note={t.checkboxList.limitNote}>
          <CheckboxList legend={t.checkboxList.topics} hint={t.checkboxList.topicsHint} options={t.checkboxList.topicOptions} max={2} defaultValue={["product"]} />
        </State>
        <State label={t.checkboxList.columns} note={t.checkboxList.columnsNote}>
          <CheckboxList legend={t.checkboxList.days} options={toOptions(t.checkboxList.dayOptions)} columns={3} defaultValue={["monday", "tuesday", "wednesday", "thursday", "friday"]} />
        </State>
        <State label={t.checkboxList.disabled} note={t.checkboxList.disabledNote}>
          <CheckboxList legend={t.checkboxList.lockedLegend} hint={t.checkboxList.lockedHint} options={toOptions(t.checkboxList.languageOptions)} disabled defaultValue={["english"]} />
        </State>
      </Piece>

      <Piece id="radio-group">
        <State label={t.radioGroup.vertical} note={t.radioGroup.verticalNote}>
          <RadioGroup legend={t.radioGroup.delivery} name="delivery" defaultValue="standard">
            <Radio value="standard" label={t.radioGroup.standard} description={t.radioGroup.standardDescription} />
            <Radio value="express" label={t.radioGroup.express} description={t.radioGroup.expressDescription} />
            <Radio value="pickup" label={t.radioGroup.pickup} description={t.radioGroup.pickupDescription} disabled />
          </RadioGroup>
        </State>
        <State label={t.radioGroup.horizontal} note={t.radioGroup.horizontalNote}>
          <RadioGroup legend={t.radioGroup.size} name="size" orientation="horizontal" defaultValue="medium">
            {toOptions(t.radioGroup.sizes).map((o) => (
              <Radio key={o.value} value={o.value} label={o.label} />
            ))}
          </RadioGroup>
        </State>
        <State label={t.radioGroup.error} note={t.radioGroup.errorNote}>
          <RadioGroup legend={t.radioGroup.contact} name="contact" error={t.radioGroup.contactError}>
            {toOptions(t.radioGroup.contactOptions).map((o) => (
              <Radio key={o.value} value={o.value} label={o.label} />
            ))}
          </RadioGroup>
        </State>
      </Piece>

      <Piece id="switch">
        <State label={t.switch.saves} note={t.switch.savesNote}>
          <SavingSwitchDemo />
        </State>
        <State label={t.switch.fails} note={t.switch.failsNote}>
          <SavingSwitchDemo fails />
        </State>
        <State label={t.switch.description} note={t.switch.descriptionNote}>
          <Switch label={t.switch.compactLayout} description={t.switch.compactLayoutDescription} />
        </State>
        <State label={t.switch.disabled} note={t.switch.disabledNote}>
          <Switch label={t.switch.sso} hint={t.switch.ssoHint} disabled />
        </State>
      </Piece>

      <Piece id="rating-input">
        <State label={t.ratingInput.choosing} note={t.ratingInput.choosingNote}>
          <RatingInput legend={t.ratingInput.legend} name="rating" />
        </State>
        <State label={t.ratingInput.rated} note={t.ratingInput.ratedNote}>
          <RatingInput legend={t.ratingInput.legend} name="rated" defaultValue={4} submittedNote={t.ratingInput.submitted} />
        </State>
        <State label={t.ratingInput.error} note={t.ratingInput.errorNote}>
          <RatingInput legend={t.ratingInput.legend} name="rating-error" error={t.ratingInput.errorMessage} />
        </State>
      </Piece>

      <Piece id="segmented-control">
        <State label={t.segmented.text} note={t.segmented.textNote}>
          <SegmentedControl legend={t.segmented.period} options={t.segmented.periods} defaultValue="month" />
        </State>
        <State label={t.segmented.icons} note={t.segmented.iconsNote}>
          <SegmentedControl
            legend={t.segmented.view}
            options={[
              { value: "list", label: t.segmented.list, icon: <List size={16} aria-hidden /> },
              { value: "grid", label: t.segmented.grid, icon: <LayoutGrid size={16} aria-hidden /> },
            ]}
          />
        </State>
      </Piece>

      <Piece id="slider">
        <State label={t.slider.readout} note={t.slider.readoutNote}>
          <Slider label={t.slider.distance} min={0} max={100} step={5} defaultValue={25} formatValue={t.slider.miles} showBounds />
        </State>
        <State label={t.slider.steps} note={t.slider.stepsNote}>
          <Slider
            label={t.slider.zoom}
            min={100}
            max={400}
            step={1}
            buttonStep={25}
            defaultValue={150}
            formatValue={(v) => `${v}%`}
            decreaseIcon={ZoomOut}
            increaseIcon={ZoomIn}
            decreaseLabel={t.slider.zoomOut}
            increaseLabel={t.slider.zoomIn}
          />
        </State>
        <State label={t.slider.disabled} note={t.slider.disabledNote}>
          <Slider label={t.slider.radius} hint={t.slider.radiusHint} defaultValue={10} formatValue={t.slider.miles} disabled />
        </State>
        <State label={t.slider.error} note={t.slider.errorNote}>
          <Slider label={t.slider.budget} min={0} max={5000} step={100} defaultValue={300} formatValue={(v) => `$${formatInteger(v)}`} error={t.slider.budgetError} />
        </State>
      </Piece>

      <Piece id="date-picker">
        <State label={t.datePicker.typeOrPick} note={t.datePicker.typeOrPickNote}>
          <DateDemo />
        </State>
        <State label={t.datePicker.bounds} note={t.datePicker.boundsNote}>
          <BoundedDateDemo />
        </State>
        <State label={t.datePicker.error} note={t.datePicker.errorNote}>
          <DatePicker label={t.datePicker.end} defaultValue="2026-09-10" error={t.datePicker.endError} />
        </State>
        <State label={t.datePicker.disabled} note={t.datePicker.disabledNote}>
          <DatePicker label={t.datePicker.renewal} hint={t.datePicker.renewalHint} defaultValue="2027-01-01" disabled />
        </State>
      </Piece>

      <Piece id="time-picker">
        <State label={t.timePicker.steps} note={t.timePicker.stepsNote}>
          <TimeDemo />
        </State>
        <State label={t.timePicker.range} note={t.timePicker.rangeNote}>
          <TimePicker label={t.timePicker.appointment} hint={t.timePicker.appointmentHint} step={15} min="09:00" max="17:00" defaultValue="10:30" />
        </State>
        <State label={t.timePicker.kept} note={t.timePicker.keptNote}>
          <TimePicker label={t.timePicker.reminder} defaultValue="10:10" />
        </State>
        <State label={t.timePicker.error} note={t.timePicker.errorNote}>
          <TimePicker label={t.timePicker.call} error={t.timePicker.callError} />
        </State>
      </Piece>

      <Piece id="date-time-picker">
        <State label={t.dateTimePicker.together} note={t.dateTimePicker.togetherNote} wide>
          <DateTimeDemo />
        </State>
        <State label={t.dateTimePicker.error} note={t.dateTimePicker.errorNote} wide>
          <DateTimePicker label={t.dateTimePicker.ends} defaultValue="2026-12-03T09:00" error={t.dateTimePicker.endsError} />
        </State>
        <State label={t.dateTimePicker.disabled} note={t.dateTimePicker.disabledNote} wide>
          <DateTimePicker label={t.dateTimePicker.locked} hint={t.dateTimePicker.lockedHint} defaultValue="2026-12-15T08:00" disabled />
        </State>
      </Piece>

      <Piece id="file-upload">
        <State label={t.fileUpload.several} note={t.fileUpload.severalNote}>
          <FileUploadDemo />
        </State>
        <State label={t.fileUpload.retry} note={t.fileUpload.retryNote}>
          <FileUploadDemo failFirst />
        </State>
        <State label={t.fileUpload.single} note={t.fileUpload.singleNote}>
          <FileUploadDemo maxFiles={1} single />
        </State>
        <State label={t.fileUpload.rows} note={t.fileUpload.rowsNote} wide>
          <FileRowsDemo />
        </State>
        <PieceNote>
          <p>{t.fileUpload.note}</p>
        </PieceNote>
      </Piece>

      <Piece id="photo-upload">
        <State label={t.photoUpload.plain} note={t.photoUpload.plainNote}>
          <PhotoUpload label={t.photoUpload.label} />
        </State>
        <State label={t.photoUpload.hint} note={t.photoUpload.hintNote}>
          <PhotoUpload label={t.photoUpload.label} hint={t.photoUpload.hintText} />
        </State>
      </Piece>

      <Piece id="image-cropper">
        <State label={t.imageCropper.formats} note={t.imageCropper.formatsNote}>
          <ImageCropperDemo />
        </State>
        <State label={t.imageCropper.small} note={t.imageCropper.smallNote}>
          <ImageCropperDemo small />
        </State>
      </Piece>

      <Piece id="profile-cover">
        <State label={t.profileCover.visitor} note={t.profileCover.visitorNote} wide>
          <ProfileCover
            name={t.profileCover.name}
            subtitle={t.profileCover.subtitle}
            rating={{ value: 4.8, count: 126 }}
            coverUrl={SAMPLE_COVER}
            logoUrl={SAMPLE_LOGO}
            headingLevel={3}
          />
        </State>
        <State label={t.profileCover.empty} note={t.profileCover.emptyNote} wide>
          <ProfileCover name={t.profileCover.emptyName} editable headingLevel={3} />
        </State>
        <State label={t.profileCover.editing} note={t.profileCover.editingNote} wide>
          <ProfileCover name={t.profileCover.name} coverUrl={SAMPLE_COVER} logoUrl={SAMPLE_LOGO} editable headingLevel={3} />
        </State>
      </Piece>

      <Piece id="photo-gallery">
        <State label={t.photoGallery.editing} note={t.photoGallery.editingNote} wide>
          <PhotoGallery
            label={t.photoGallery.label}
            defaultPhotos={SAMPLE_PHOTOS.map((url, i) => ({ id: `sample-${i}`, url, alt: t.photoGallery.alts[i] }))}
            max={6}
            editable
            headingLevel={3}
          />
        </State>
        <State label={t.photoGallery.visitor} note={t.photoGallery.visitorNote} wide>
          <PhotoGallery
            label={t.photoGallery.label}
            defaultPhotos={SAMPLE_PHOTOS.map((url, i) => ({ id: `sample-${i}`, url, alt: t.photoGallery.alts[i] }))}
            headingLevel={3}
          />
        </State>
      </Piece>

      <Piece id="card-form">
        <State label={t.cardForm.empty} note={t.cardForm.emptyNote}>
          <CardFormDemo />
        </State>
        <State label={t.cardForm.declined} note={t.cardForm.declinedNote}>
          <CardFormDemo declined />
        </State>
      </Piece>
    </SectionPage>
  );
}
