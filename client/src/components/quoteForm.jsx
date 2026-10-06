import { useState } from "react";
import {
    COVER_HISTORIES,
    COVER_TYPES,
    EMPTY_FORM,
    EXTRA_TIERS,
    HOSPITAL_TIERS,
    MAX_AGE,
    MAX_DISCOUNT,
    MAX_NAME_LENGTH,
    MAX_NOTES_LENGTH,
    MIN_AGE,
    MIN_DISCOUNT,
    needsApplicant2,
    PAYMENT_FREQUENCIES,
    toPayLoad,
    validateForm
} from "../quoteForm.js";
import "./quoteForm.css";

function Field({ id, label, hint, error, children}){
    return (
        <div className={error ? "field has_error" : "field"}>
            <label htmlFor={id}>
                {label}
            </label>
            {hint && (
                <p className="hint" id={`${id}_hint`}>
                    {hint}
                </p>
            )}
            {children}
            {error && (
                <p className="field_error" id={`${id}_error`}>
                    {error}
                </p>
            )}
        </div>
    );
};

function ChoiceGroup({ name, legend, options, value, onChange, error}){
    return (
        <fieldset className={error ? "choice_group has_error": "choice_group"}>
            <legend>
                {legend}
            </legend>
            <div className="choices">
                {options.map((o) => (
                    <label key={o.value} className={value === o.value ? "choice is_selected" : "choice"}>
                        <input
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={value === o.value}
                            onChange={() => onChange(o.value)}
                        />
                        <span className="choice_label">
                            {o.label}
                        </span>
                        {o.hint && <span className="choice_hint">{o.hint}</span>}
                    </label>
                ))}
                {error && <p className="field_error">{error}</p>}
            </div>
        </fieldset>
    );
};

function ApplicantFields({ n, values, errors, update}){
    const ageId = `applicant${n}_age`;
    const historyId = `applicant${n}_cover_history`;
    return (
        <fieldset className="applicant">
            <legend>
                Applicant {n}
            </legend>
            <div className="field_row">
                <Field id={ageId} label="Age" hint={`${MIN_AGE}-${MAX_AGE}`} error={errors[ageId]}>
                    <input
                        id={ageId}
                        type="number"
                        inputMode="numeric"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        step={1}
                        value={values[ageId]}
                        onChange={(e) => update(ageId, e.target.value)}
                        aria-invalid={Boolean(errors[ageId])}
                        aria-describedby={errors[ageId] ? `${ageId}_error` : `${ageId}_hint`}
                    />
                </Field>
                <Field
                    id={historyId}
                    label="Held private hospital cover before?"
                    hint="Used for Lifetime Health Cover (LHC) loading"
                    error={errors[historyId]}
                >
                    <select
                        id={historyId}
                        value={values[historyId]}
                        onChange={(e) => update(historyId, e.target.value)}
                        aria-invalid={Boolean(errors[historyId])}
                        aria-describedby={errors[historyId] ? `${historyId}_error` : `${historyId}_hint`}
                    >
                        <option value="">
                            Choose...
                        </option>
                        {COVER_HISTORIES.map((h) => (
                            <option key={h.value} value={h.value}>
                                {h.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        </fieldset>
    );
};

export default function QuoteForm({ initialValues = EMPTY_FORM, submitLabel, onSubmit, onCancel}){
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [attempted, setAttempted] = useState(false);
    const [saving, setSaving] = useState(false);

    function update(field, value){
        const next = {...values, [field]: value};
        setValues(next);
        if (attempted){
            setErrors(validateForm(next));
        };
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setAttempted(true);

        const found = validateForm(values);
        setErrors(found);
        if (Object.keys(found).length > 0){
            window.scrollTo({top: 0, behavior: "smooth"});
            return;
        };

        setSaving(true);
        try {
            await onSubmit(toPayLoad(values));
        }
        catch (err){
            const serverErrors = err.errors && Object.keys(err.errors).length > 0 ? err.errors : {_form: err.message};
            setErrors(serverErrors);
            window.scrollTo({top: 0, behavior: "smooth"});
        }
        finally {
            setSaving(false)
        };
    };

    const fieldErrorCount = Object.keys(errors).filter((k) => k !== "_form").length;
    const showApplicant2 = needsApplicant2(values.cover_type);
    const isYearly = values.payment_frequency === "Yearly";

    return (
        <form className="quote_form" onSubmit={handleSubmit} noValidate>
            {(errors._form || fieldErrorCount > 0) && (
                <div className="form_alert" role="alert">
                    {errors._form && <p>{errors._form}</p>}
                    {fieldErrorCount > 0 && (
                        <p>
                            {fieldErrorCount === 1 ? "1 field needs" : `${fieldErrorCount} fields need`} fixing before this quote can be saved.
                        </p>
                    )}
                </div>
            )}

            <section className="form_section">
                <h2>
                    Customer
                </h2>
                <Field id="customer_name" label="Customer name" error ={errors.customer_name}>
                    <input
                        id="customer_name"
                        type="text"
                        autoComplete="off"
                        maxLength={MAX_NAME_LENGTH}
                        value={values.customer_name}
                        onChange={(e) => update("customer_name", e.target.value)}
                        aria-invalid={Boolean(errors.customer_name)}
                        aria-describedby={errors.customer_name ? "customer_name_error" : undefined}
                    />
                </Field>
            </section>

            <section className="form_section">
                <h2>
                    Who's covered
                </h2>
                <ChoiceGroup
                    name="cover_type"
                    legend="Cover type"
                    options={COVER_TYPES}
                    value={values.cover_type}
                    onChange={(v) => update("cover_type", v)}
                    error={errors.cover_type}
                />
                <ApplicantFields n={1} values={values} errors={errors} update={update}/>
                {showApplicant2 && <ApplicantFields n={2} values={values} errors={errors} update={update}/>}
            </section>

            <section className="form_section">
                <h2>
                    Cover
                </h2>
                <p className="section_note">
                    Prices are per adult per month.
                </p>
                <div className="field_row">
                    <Field id="hospital_cover" label="Hospital cover" error={errors.hospital_cover}>
                        <select
                            id="hospital_cover"
                            value={values.hospital_cover}
                            onChange={(e) => update("hospital_cover", e.target.value)}
                            aria-invalid={Boolean(errors.hospital_cover)}
                        >
                            <option value="">
                                Choose...
                            </option>
                            {HOSPITAL_TIERS.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.value === "None" ? "None" : `${t.value} ($${t.price})`}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field id="extras_cover" label="Extras cover" error={errors.extras_cover}>
                        <select
                            id="extras_cover"
                            value={values.extras_cover}
                            onChange={(e) => update("extras_cover", e.target.value)}
                            aria-invalid={Boolean(errors.extras_cover)}
                        >
                            <option value="">
                                Choose...
                            </option>
                            {EXTRA_TIERS.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.value === "None" ? "None" : `${t.value} ($${t.price})`}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
                {errors.cover_selection && <p className="field_error">{errors.cover_selection}</p>}
            </section>

            <section className="form_section">
                <h2>
                    Payment
                </h2>
                <ChoiceGroup
                    name="payment_frequency"
                    legend="Payment frequency"
                    options={PAYMENT_FREQUENCIES}
                    value={values.payment_frequency}
                    onChange={(v) => update("payment_frequency", v)}
                    error={errors.payment_frequency}
                />
                {isYearly && (
                    <Field
                        id="annual_discount"
                        label="Annual-payment discount (%)"
                        hint={`${MIN_DISCOUNT}%-${MAX_DISCOUNT}%`}
                        error={errors.annual_discount}
                    >
                        <input
                            id="annual_discount"
                            className="input_short"
                            type="number"
                            inputMode="decimal"
                            min={MIN_DISCOUNT}
                            max={MAX_DISCOUNT}
                            step="0.5"
                            value={values.annual_discount}
                            onChange={(e) => update("annual_discount", e.target.value)}
                            aria-invalid={Boolean(errors.annual_discount)}
                            aria-describedby={errors.annual_discount ? "annual_discount_error" : "annual_discount_hint"}
                        />
                    </Field>
                )}
            </section>

            <section className="form_section">
                <h2>Notes</h2>
                <Field id="notes" label="Notes (optional)" error={errors.notes}>
                    <textarea
                        id="notes"
                        rows={3}
                        maxLength={MAX_NOTES_LENGTH}
                        value={values.notes}
                        onChange={(e) => update("notes", e.target.value)}
                    />
                </Field>
            </section>

            <div className="form_actions">
                <button type="submit" className="button button_primary" disabled={saving}>
                    {saving ? "Saving..." : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="button" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};