import { CreditCard, DatabaseBackup, Download, FileText, Globe, Headset, KeyRound, Landmark, LayoutGrid, List, ZoomIn, ZoomOut } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { CheckboxList } from "@/components/ui/checkbox-list";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Field } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import { TextLink } from "@/components/ui/link";
import { MaskedField } from "@/components/ui/masked-field";
import { PasswordField } from "@/components/ui/password-field";
import { PhotoGallery } from "@/components/ui/photo-gallery";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { ProfileCover } from "@/components/ui/profile-cover";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { RatingInput } from "@/components/ui/rating-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SAMPLE_COVER, SAMPLE_LOGO, SAMPLE_PHOTOS } from "../samples";
import { SectionPage } from "./SectionPage";
import { CardFormDemo, FileRowsDemo, FileUploadDemo, ImageCropperDemo } from "./file-demos";
import {
  DateDemo,
  DateMaskDemo,
  HoursDemo,
  PhoneErrorDemo,
  ZipErrorDemo,
  DateTimeDemo,
  FailedSwitchDemo,
  FarDateDemo,
  FieldFormDemo,
  IndeterminateDemo,
  PeriodDemo,
  PhoneDemo,
  PreferencesDemo,
  SliderSubmittedDemo,
  TimeDemo,
  ZipLookupDemo,
} from "./form-demos";

const t = messages.workbench.demos;

/** Cards fill the row and wrap at a readable width, instead of a fixed count of columns. */
const CARD_GRID = "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]";

/** One rating for the profile in every state, so the three read as one profile. */
const COVER_RATING = { value: 4.6, count: 128 };

/** The gallery's sample photos, numbered in their first order. */
const SAMPLE_GALLERY = SAMPLE_PHOTOS.map((url, i) => ({ id: `sample-${i}`, url, alt: t.photoGallery.alts[i] }));

const toOptions = (labels: readonly string[]) => labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

export function FormsPage() {
  return (
    <SectionPage id="forms">
      <Piece id="field">
        <State label={t.field.inForm} note={t.field.inFormNote} wide>
          <FieldFormDemo />
        </State>
        <State label={t.field.plain} note={t.field.plainNote}>
          <Field label={t.field.displayName} icon="name" allow="name" hint={t.field.displayNameHint} placeholder={t.field.displayNamePlaceholder} />
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
        <State label={t.field.processing} note={t.field.processingNote}>
          <Field
            label={t.field.address}
            icon="address"
            status="loading"
            loadingLabel={t.field.looking}
            placeholder={t.field.addressPlaceholder}
            defaultValue="1600 Pennsylvania Ave"
          />
        </State>
        <State label={t.field.confirmedState} note={t.field.confirmedNote}>
          <Field
            label={t.field.verified}
            icon="website"
            status="valid"
            validLabel={t.field.confirmed}
            placeholder={t.field.websitePlaceholder}
            defaultValue="example.com"
          />
        </State>
        <State label={t.field.textarea} note={t.field.textareaNote}>
          <Field as="textarea" label={t.field.about} hint={t.field.aboutHint} placeholder={t.field.aboutPlaceholder} maxLength={280} />
        </State>
        <State label={t.field.disabled} note={t.field.disabledNote}>
          <Field label={t.field.plan} disabled placeholder={t.field.planPlaceholder} defaultValue="Team" hint={t.field.planReason} />
        </State>
        <State label={t.field.hidden} note={t.field.hiddenNote} wide>
          <Field label={t.field.search} hiddenLabel type="search" icon="search" placeholder={t.field.searchPlaceholder} />
        </State>
        <State label={t.field.readOnly} note={t.field.readOnlyNote}>
          <Field label={t.field.accountId} readOnly placeholder={t.field.accountIdPlaceholder} defaultValue={t.field.accountIdValue} hint={t.field.accountIdHint} />
        </State>
        <State label={t.field.adornments} note={t.field.adornmentsNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Field label={t.field.price} prefix="$" inputMode="decimal" placeholder={t.field.pricePlaceholder} defaultValue="49.00" maxLength={12} />
            <Field label={t.field.distance} suffix="mi" inputMode="numeric" placeholder={t.field.distancePlaceholder} defaultValue="25" maxLength={5} />
          </div>
        </State>
        <PieceNote paragraphs={t.field.explain} />
      </Piece>

      <Piece id="password-field">
        <State label={t.password.signIn} note={t.password.signInNote}>
          <PasswordField label={t.password.current} icon="password" placeholder={t.password.placeholder} autoComplete="current-password" />
        </State>
        <State label={t.password.signUp} note={t.password.signUpNote}>
          <PasswordField label={t.password.newPassword} icon="password" placeholder={t.password.placeholder} autoComplete="new-password" minLength={8} />
        </State>
        <State label={t.password.error} note={t.password.errorNote}>
          <PasswordField
            label={t.password.newPassword}
            icon="password"
            placeholder={t.password.placeholder}
            autoComplete="new-password"
            minLength={8}
            defaultValue="abc"
            error={t.password.tooShort}
          />
        </State>
        <State label={t.password.met} note={t.password.metNote}>
          <PasswordField
            label={t.password.newPassword}
            icon="password"
            placeholder={t.password.placeholder}
            autoComplete="new-password"
            minLength={8}
            defaultValue="correct-horse"
          />
        </State>
        <PieceNote paragraphs={t.password.explain} />
      </Piece>

      <Piece id="masked-field">
        <State label={t.masked.inForm} note={t.masked.inFormNote} wide>
          <ZipLookupDemo />
        </State>
        <State label={t.masked.phone} note={t.masked.phoneNote}>
          <MaskedField mask="phone" label={t.masked.phoneLabel} icon="phone" placeholder="(213) 373-4253" />
        </State>
        <State label={t.masked.date} note={t.masked.dateNote}>
          <DateMaskDemo />
        </State>
        <State label={t.masked.money} note={t.masked.moneyNote}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <MaskedField mask="currency" label={t.masked.priceLabel} prefix="$" placeholder="0.00" />
            <MaskedField mask="integer" label={t.masked.seatsLabel} suffix={t.masked.seatsSuffix} placeholder={t.masked.seatsPlaceholder} defaultValue="1500" />
          </div>
        </State>
        <State label={t.masked.processing} note={t.masked.processingNote}>
          <MaskedField
            mask="zip"
            label={t.masked.zipLabel}
            icon="zip"
            placeholder="90210"
            defaultValue="60601"
            readOnly
            status="loading"
            loadingLabel={t.masked.zipLooking}
          />
        </State>
        <State label={t.masked.error} note={t.masked.errorNote}>
          <ZipErrorDemo />
        </State>
        <State label={t.masked.notInCountry} note={t.masked.notInCountryNote}>
          <PhoneErrorDemo />
        </State>
        <State label={t.masked.international} note={t.masked.internationalNote} wide>
          <PhoneDemo />
        </State>
        <PieceNote paragraphs={t.masked.explain} />
      </Piece>

      <Piece id="select">
        <State label={t.select.single} note={t.select.singleNote}>
          <Select label={t.select.role} hint={t.select.roleHint} placeholder={t.select.rolePlaceholder} options={toOptions(t.select.roleOptions)} />
        </State>
        <State label={t.select.error} note={t.select.errorNote}>
          <Select label={t.select.role} placeholder={t.select.rolePlaceholder} options={toOptions(t.select.roleOptions)} error={t.select.roleError} />
        </State>
        <State label={t.select.described} note={t.select.describedNote}>
          <Select label={t.select.plan} options={t.select.planOptions} defaultValue="team" />
        </State>
        <State label={t.select.disabled} note={t.select.disabledNote}>
          <Select label={t.select.region} options={toOptions(t.select.regionOptions)} defaultValue="united-states" hint={t.select.regionReason} disabled />
        </State>
        <PieceNote paragraphs={t.select.explain} />
      </Piece>

      <Piece id="select-search">
        <State label={t.select.search} note={t.select.searchNote}>
          <Select
            label={t.select.timezone}
            icon="time"
            searchable
            placeholder={t.select.timezonePlaceholder}
            searchPlaceholder={t.select.timezoneSearch}
            options={toOptions(t.select.timezoneOptions)}
          />
        </State>
        <State label={t.select.chosen} note={t.select.chosenNote}>
          <Select
            label={t.select.timezone}
            icon="time"
            searchable
            searchPlaceholder={t.select.timezoneSearch}
            options={toOptions(t.select.timezoneOptions)}
            defaultValue="london"
          />
        </State>
        <PieceNote paragraphs={t.select.explainSearch} />
      </Piece>

      <Piece id="select-multiple">
        <State label={t.select.multiple} note={t.select.multipleNote}>
          <Select multiple label={t.select.features} options={toOptions(t.select.featureOptions)} />
        </State>
        <State label={t.select.checked} note={t.select.checkedNote}>
          <Select
            multiple
            label={t.select.features}
            hint={t.select.featuresHint}
            options={toOptions(t.select.featureOptions)}
            defaultValue={["single-sign-on", "audit-log", "data-export"]}
          />
        </State>
        <State label={t.select.multipleSearch} note={t.select.multipleSearchNote}>
          <Select
            multiple
            searchable
            label={t.select.features}
           
            searchPlaceholder={t.select.featuresSearch}
            options={toOptions(t.select.featureOptions)}
            defaultValue={["api-access"]}
          />
        </State>
        <State label={t.select.multipleError} note={t.select.multipleErrorNote}>
          <Select multiple label={t.select.features} options={toOptions(t.select.featureOptions)} error={t.select.featuresError} />
        </State>
        <PieceNote paragraphs={t.select.explainMultiple} />
      </Piece>

      <Piece id="fieldset">
        <State label={t.fieldset.grouping} note={t.fieldset.groupingNote} wide>
          <Fieldset legend={t.fieldset.legend} hint={t.fieldset.hint}>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Field label={t.fieldset.street} icon="address" placeholder={t.fieldset.streetPlaceholder} autoComplete="address-line1" maxLength={100} />
              <Field label={t.fieldset.unit} placeholder={t.fieldset.unitPlaceholder} autoComplete="address-line2" maxLength={20} />
              <Field label={t.fieldset.city} placeholder={t.fieldset.cityPlaceholder} autoComplete="address-level2" allow="name" />
              <MaskedField mask="zip" label={t.fieldset.zip} icon="zip" placeholder="90210" autoComplete="postal-code" />
            </div>
          </Fieldset>
        </State>
        <State label={t.fieldset.groupError} note={t.fieldset.groupErrorNote}>
          <HoursDemo />
        </State>
        <State label={t.fieldset.disabled} note={t.fieldset.disabledNote}>
          <Fieldset legend={t.fieldset.lockedLegend} hint={t.fieldset.lockedHint} disabled>
            <div className="grid gap-3">
              <Field label={t.fieldset.street} icon="address" placeholder={t.fieldset.streetPlaceholder} defaultValue="350 Fifth Avenue" />
              <Field label={t.fieldset.city} placeholder={t.fieldset.cityPlaceholder} defaultValue="New York" />
            </div>
          </Fieldset>
        </State>
        <PieceNote paragraphs={t.fieldset.explain} />
      </Piece>

      <Piece id="checkbox">
        <State label={t.checkbox.alone} note={t.checkbox.aloneNote}>
          <Checkbox label={t.checkbox.digest} hint={t.checkbox.digestHint} defaultChecked />
        </State>
        <State label={t.checkbox.error} note={t.checkbox.errorNote}>
          <Checkbox label={t.checkbox.consent} error={t.checkbox.consentError} />
        </State>
        <State label={t.checkbox.description} note={t.checkbox.descriptionNote}>
          <Checkbox label={t.checkbox.giftWrap} description={t.checkbox.giftWrapDescription} />
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
        <State label={t.checkbox.disabled} note={t.checkbox.disabledNote}>
          <div className="w-full">
            <Checkbox label={t.checkbox.accepted} hint={t.checkbox.acceptedHint} defaultChecked disabled />
            <Checkbox label={t.checkbox.partners} hint={t.checkbox.partnersHint} disabled />
          </div>
        </State>
        <PieceNote paragraphs={t.checkbox.explain} />
      </Piece>

      <Piece id="checkbox-card">
        <State label={t.checkboxCard.label} note={t.checkboxCard.note} wide>
          <Fieldset legend={t.checkboxCard.legend}>
            <div className={CARD_GRID}>
              <CheckboxCard name="payment" value="card" icon={CreditCard} label={t.checkboxCard.card} description={t.checkboxCard.cardDescription} defaultChecked />
              <CheckboxCard name="payment" value="transfer" icon={Landmark} label={t.checkboxCard.transfer} description={t.checkboxCard.transferDescription} defaultChecked />
              <CheckboxCard name="payment" value="invoice" icon={FileText} label={t.checkboxCard.invoice} description={t.checkboxCard.invoiceDescription} />
            </div>
          </Fieldset>
        </State>
        <State label={t.checkboxCard.error} note={t.checkboxCard.errorNote}>
          <Fieldset legend={t.checkboxCard.addons} error={t.checkboxCard.errorMessage}>
            <div className={CARD_GRID}>
              <CheckboxCard icon={Headset} label={t.checkboxCard.support} />
              <CheckboxCard icon={DatabaseBackup} label={t.checkboxCard.backups} />
              <CheckboxCard icon={KeyRound} label={t.checkboxCard.sso} />
            </div>
          </Fieldset>
        </State>
        <State label={t.checkboxCard.disabled} note={t.checkboxCard.disabledNote}>
          <Fieldset legend={t.checkboxCard.extras}>
            <div className={CARD_GRID}>
              <CheckboxCard icon={Download} label={t.checkboxCard.exports} defaultChecked />
              <CheckboxCard icon={Globe} label={t.checkboxCard.domain} description={t.checkboxCard.domainDescription} disabled />
            </div>
          </Fieldset>
        </State>
        <PieceNote paragraphs={t.checkboxCard.explain} />
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
            className="max-w-md"
          />
        </State>
        <State label={t.checkboxList.limit} note={t.checkboxList.limitNote}>
          <CheckboxList
            legend={t.checkboxList.topics}
            hint={t.checkboxList.topicsHint}
            options={t.checkboxList.topicOptions}
            max={2}
            defaultValue={["product"]}
            className="max-w-md"
          />
        </State>
        <State label={t.checkboxList.facet} note={t.checkboxList.facetNote}>
          <CheckboxList legend={t.checkboxList.category} options={t.checkboxList.categoryOptions} clearable defaultValue={["design", "sales"]} className="max-w-xs" />
        </State>
        <State label={t.checkboxList.disabled} note={t.checkboxList.disabledNote}>
          <CheckboxList
            legend={t.checkboxList.lockedLegend}
            hint={t.checkboxList.lockedHint}
            options={toOptions(t.checkboxList.languageOptions)}
            disabled
            defaultValue={["english"]}
            className="max-w-md"
          />
        </State>
        <State label={t.checkboxList.columns} note={t.checkboxList.columnsNote}>
          <CheckboxList legend={t.checkboxList.days} options={toOptions(t.checkboxList.dayOptions)} columns={3} defaultValue={["monday", "tuesday", "wednesday", "thursday", "friday"]} />
        </State>
        <State label={t.checkboxList.error} note={t.checkboxList.errorNote}>
          <CheckboxList legend={t.checkboxList.topics} options={t.checkboxList.topicOptions} error={t.checkboxList.topicsError} className="max-w-md" />
        </State>
        <PieceNote paragraphs={t.checkboxList.explain} />
      </Piece>

      <Piece id="radio-group">
        <State label={t.radioGroup.vertical} note={t.radioGroup.verticalNote}>
          <RadioGroup legend={t.radioGroup.delivery} name="delivery" defaultValue="standard">
            <Radio value="standard" label={t.radioGroup.standard} description={t.radioGroup.standardDescription} />
            <Radio value="express" label={t.radioGroup.express} description={t.radioGroup.expressDescription} />
            <Radio value="pickup" label={t.radioGroup.pickup} />
          </RadioGroup>
        </State>
        <State label={t.radioGroup.withDisabled} note={t.radioGroup.withDisabledNote}>
          <RadioGroup legend={t.radioGroup.plan} name="plan" defaultValue="basic">
            <Radio value="basic" label={t.radioGroup.basic} description={t.radioGroup.basicDescription} />
            <Radio value="pro" label={t.radioGroup.pro} description={t.radioGroup.proDescription} disabled />
          </RadioGroup>
        </State>
        <State label={t.radioGroup.horizontal} note={t.radioGroup.horizontalNote}>
          <RadioGroup legend={t.radioGroup.sameAddress} name="same-address" orientation="horizontal" error={t.radioGroup.sameError}>
            <Radio value="yes" label={t.radioGroup.yes} />
            <Radio value="no" label={t.radioGroup.no} />
          </RadioGroup>
        </State>
        <State label={t.radioGroup.disabled} note={t.radioGroup.disabledNote}>
          <RadioGroup legend={t.radioGroup.locked} name="currency" hint={t.radioGroup.lockedHint} defaultValue="usd" disabled>
            <Radio value="usd" label={t.radioGroup.usd} />
            <Radio value="eur" label={t.radioGroup.eur} />
          </RadioGroup>
        </State>
        <PieceNote paragraphs={t.radioGroup.explain} />
      </Piece>

      <Piece id="switch">
        <State label={t.switch.offOn} note={t.switch.offOnNote}>
          <div className="w-full">
            <Switch label={t.switch.requests} />
            <Switch label={t.switch.showPhone} defaultChecked />
          </div>
        </State>
        <State label={t.switch.described} note={t.switch.describedNote}>
          <div className="w-full">
            <Switch label={t.switch.mentions} description={t.switch.mentionsDescription} defaultChecked />
            <Switch label={t.switch.digest} hint={t.switch.digestHint} />
          </div>
        </State>
        <State label={t.switch.saving} note={t.switch.savingNote}>
          <Switch label={t.switch.reminders} checked saving />
        </State>
        <State label={t.switch.failed} note={t.switch.failedNote}>
          <FailedSwitchDemo />
        </State>
        <State label={t.switch.disabled} note={t.switch.disabledNote}>
          <div className="w-full">
            <Switch label={t.switch.sso} hint={t.switch.ssoHint} disabled />
            <Switch label={t.switch.locked} hint={t.switch.lockedHint} defaultChecked disabled />
          </div>
        </State>
        <State label={t.switch.list} note={t.switch.listNote}>
          <PreferencesDemo />
        </State>
        <PieceNote paragraphs={t.switch.explain} />
      </Piece>

      <Piece id="rating-input">
        <State label={t.ratingInput.choosing} note={t.ratingInput.choosingNote}>
          <RatingInput legend={t.ratingInput.legend} name="rating" />
        </State>
        <State label={t.ratingInput.error} note={t.ratingInput.errorNote}>
          <RatingInput legend={t.ratingInput.legend} name="rating-error" error={t.ratingInput.errorMessage} />
        </State>
        <State label={t.ratingInput.rated} note={t.ratingInput.ratedNote}>
          <RatingInput legend={t.ratingInput.legend} name="rated" defaultValue={4} submittedNote={t.ratingInput.submitted} />
        </State>
        <State label={t.ratingInput.disabled} note={t.ratingInput.disabledNote}>
          <RatingInput legend={t.ratingInput.legend} name="rating-locked" hint={t.ratingInput.disabledHint} disabled />
        </State>
        <PieceNote paragraphs={t.ratingInput.explain} />
      </Piece>

      <Piece id="segmented-control">
        <State label={t.segmented.text} note={t.segmented.textNote}>
          <SegmentedControl
            legend={t.segmented.view}
            options={[
              { value: "list", label: t.segmented.list, icon: <List size={16} aria-hidden /> },
              { value: "grid", label: t.segmented.grid, icon: <LayoutGrid size={16} aria-hidden /> },
            ]}
          />
        </State>
        <State label={t.segmented.four} note={t.segmented.fourNote}>
          <SegmentedControl legend={t.segmented.range} options={t.segmented.ranges} defaultValue="week" />
        </State>
        <State label={t.segmented.hidden} note={t.segmented.hiddenNote} wide>
          <SegmentedControl legend={t.segmented.sort} hiddenLegend options={t.segmented.sorts} />
        </State>
        <PieceNote paragraphs={t.segmented.explain} />
      </Piece>

      <Piece id="slider">
        <State label={t.slider.readout} note={t.slider.readoutNote}>
          <SliderSubmittedDemo />
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
        <State label={t.slider.noButtons} note={t.slider.noButtonsNote}>
          <Slider label={t.slider.minRating} min={0} max={5} step={0.5} defaultValue={3.5} formatValue={t.slider.stars} buttons={false} />
        </State>
        <State label={t.slider.atLimit} note={t.slider.atLimitNote}>
          <Slider label={t.slider.volume} min={0} max={10} defaultValue={10} />
        </State>
        <State label={t.slider.disabled} note={t.slider.disabledNote}>
          <Slider label={t.slider.radius} hint={t.slider.radiusHint} defaultValue={10} formatValue={t.slider.miles} disabled />
        </State>
        <State label={t.slider.error} note={t.slider.errorNote}>
          <Slider label={t.slider.budget} min={0} max={5000} step={100} defaultValue={300} formatValue={(v) => `$${formatInteger(v)}`} error={t.slider.budgetError} />
        </State>
        <PieceNote paragraphs={t.slider.explain} />
      </Piece>

      <Piece id="date-picker">
        <State label={t.datePicker.empty} note={t.datePicker.emptyNote}>
          <DateDemo />
        </State>
        <State label={t.datePicker.filled} note={t.datePicker.filledNote}>
          <DateDemo initial="2026-09-17" />
        </State>
        <State label={t.datePicker.bounds} note={t.datePicker.boundsNote}>
          <DatePicker label={t.datePicker.review} hint={t.datePicker.reviewHint} min="2026-09-10" max="2026-10-20" defaultValue="2026-09-24" />
        </State>
        <State label={t.datePicker.error} note={t.datePicker.errorNote}>
          <DatePicker label={t.datePicker.end} defaultValue="2026-09-10" error={t.datePicker.endError} />
        </State>
        <State label={t.datePicker.far} note={t.datePicker.farNote}>
          <FarDateDemo />
        </State>
        <State label={t.datePicker.disabled} note={t.datePicker.disabledNote}>
          <DatePicker label={t.datePicker.renewal} hint={t.datePicker.renewalHint} defaultValue="2027-01-01" disabled />
        </State>
        <PieceNote paragraphs={t.datePicker.explain} />
      </Piece>

      <Piece id="time-picker">
        <State label={t.timePicker.empty} note={t.timePicker.emptyNote}>
          <TimeDemo />
        </State>
        <State label={t.timePicker.filled} note={t.timePicker.filledNote}>
          <TimeDemo initial="14:30" />
        </State>
        <State label={t.timePicker.range} note={t.timePicker.rangeNote}>
          <TimePicker label={t.timePicker.closes} step={15} min="08:00" max="18:00" defaultValue="17:45" />
        </State>
        <State label={t.timePicker.kept} note={t.timePicker.keptNote}>
          <TimePicker label={t.timePicker.opens} hint={t.timePicker.keptHint} defaultValue="07:50" />
        </State>
        <State label={t.timePicker.error} note={t.timePicker.errorNote}>
          <TimePicker label={t.timePicker.closes} defaultValue="07:00" error={t.timePicker.closesError} />
        </State>
        <State label={t.timePicker.disabled} note={t.timePicker.disabledNote}>
          <TimePicker label={t.timePicker.opens} hint={t.timePicker.closedHint} disabled />
        </State>
        <PieceNote paragraphs={t.timePicker.explain} />
      </Piece>

      <Piece id="date-time-picker">
        <State label={t.dateTimePicker.empty} note={t.dateTimePicker.emptyNote}>
          <DateTimeDemo />
        </State>
        <State label={t.dateTimePicker.filled} note={t.dateTimePicker.filledNote}>
          <DateTimeDemo initial="2026-09-17T14:30" />
        </State>
        <State label={t.dateTimePicker.disabled} note={t.dateTimePicker.disabledNote}>
          <DateTimePicker label={t.dateTimePicker.locked} hint={t.dateTimePicker.lockedHint} defaultValue="2026-12-15T08:00" disabled />
        </State>
        <State label={t.dateTimePicker.range} note={t.dateTimePicker.rangeNote}>
          <DateTimePicker
            label={t.dateTimePicker.pickup}
            hint={t.dateTimePicker.pickupHint}
            min="2026-09-01"
            max="2026-09-30"
            minTime="08:00"
            maxTime="18:00"
            step={15}
            defaultValue="2026-09-15T09:00"
          />
        </State>
        <State label={t.dateTimePicker.period} note={t.dateTimePicker.periodNote} wide>
          <PeriodDemo />
        </State>
        <PieceNote paragraphs={t.dateTimePicker.explain} />
      </Piece>

      <Piece id="file-upload">
        <State label={t.fileUpload.several} note={t.fileUpload.severalNote}>
          <FileUploadDemo maxFiles={3} />
        </State>
        <State label={t.fileUpload.single} note={t.fileUpload.singleNote}>
          <FileUploadDemo maxFiles={1} single />
        </State>
        <State label={t.fileUpload.retry} note={t.fileUpload.retryNote}>
          <FileUploadDemo maxFiles={3} failFirst />
        </State>
        <State label={t.fileUpload.low} note={t.fileUpload.lowNote}>
          <FileUploadDemo maxFiles={3} maxBytes={100 * 1024} />
        </State>
        <State label={t.fileUpload.rows} note={t.fileUpload.rowsNote} wide>
          <FileRowsDemo />
        </State>
        <PieceNote paragraphs={t.fileUpload.explain} />
      </Piece>

      <Piece id="photo-upload">
        <State label={t.photoUpload.plain} note={t.photoUpload.plainNote}>
          <PhotoUpload label={t.photoUpload.label} hint={t.photoUpload.hintText} />
        </State>
        <State label={t.photoUpload.low} note={t.photoUpload.lowNote}>
          <PhotoUpload label={t.photoUpload.label} hint={t.photoUpload.lowHint} maxBytes={100 * 1024} />
        </State>
        <PieceNote paragraphs={t.photoUpload.explain} />
      </Piece>

      <Piece id="image-cropper">
        <State label={t.imageCropper.formats} note={t.imageCropper.formatsNote} wide>
          <ImageCropperDemo />
        </State>
        <PieceNote paragraphs={t.imageCropper.explain} />
      </Piece>

      <Piece id="profile-cover">
        <State label={t.profileCover.empty} note={t.profileCover.emptyNote} wide>
          <ProfileCover name={t.profileCover.name} subtitle={t.profileCover.subtitle} rating={COVER_RATING} editable headingLevel={3} />
        </State>
        <State label={t.profileCover.editing} note={t.profileCover.editingNote} wide>
          <ProfileCover
            name={t.profileCover.name}
            subtitle={t.profileCover.subtitle}
            rating={COVER_RATING}
            coverUrl={SAMPLE_COVER}
            logoUrl={SAMPLE_LOGO}
            editable
            headingLevel={3}
          />
        </State>
        <State label={t.profileCover.visitor} note={t.profileCover.visitorNote} wide>
          <ProfileCover
            name={t.profileCover.name}
            subtitle={t.profileCover.subtitle}
            rating={COVER_RATING}
            coverUrl={SAMPLE_COVER}
            logoUrl={SAMPLE_LOGO}
            headingLevel={3}
          />
        </State>
        <PieceNote paragraphs={t.profileCover.explain} />
      </Piece>

      <Piece id="photo-gallery">
        <State label={t.photoGallery.empty} note={t.photoGallery.emptyNote} wide>
          <PhotoGallery label={t.photoGallery.label} max={12} editable headingLevel={3} />
        </State>
        <State label={t.photoGallery.editing} note={t.photoGallery.editingNote} wide>
          <PhotoGallery label={t.photoGallery.label} defaultPhotos={SAMPLE_GALLERY} max={12} editable headingLevel={3} />
        </State>
        <State label={t.photoGallery.full} note={t.photoGallery.fullNote} wide>
          <PhotoGallery label={t.photoGallery.label} defaultPhotos={SAMPLE_GALLERY} max={4} editable headingLevel={3} />
        </State>
        <State label={t.photoGallery.visitor} note={t.photoGallery.visitorNote} wide>
          <PhotoGallery label={t.photoGallery.label} defaultPhotos={SAMPLE_GALLERY} headingLevel={3} />
        </State>
        <PieceNote paragraphs={t.photoGallery.explain} />
      </Piece>

      <Piece id="card-form">
        <State label={t.cardForm.empty} note={t.cardForm.emptyNote}>
          <CardFormDemo />
        </State>
        <State label={t.cardForm.declined} note={t.cardForm.declinedNote}>
          <CardFormDemo declined />
        </State>
        <PieceNote paragraphs={t.cardForm.explain} />
      </Piece>
    </SectionPage>
  );
}
