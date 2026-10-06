export const MIN_AGE = 18;
export const MAX_AGE = 100;
export const MIN_DISCOUNT = 0;
export const MAX_DISCOUNT = 10;
export const MAX_NAME_LENGTH = 100;
export const MAX_NOTES_LENGTH = 1000;

export const COVER_TYPES = [
    { value: "Single", label: "Single", hint: "1 adult"},
    { value: "Couple", label: "Couple", hint: "2 adults"},
    { value: "Family", label: "Family", hint: "2 adults + children, $30/month"},
];

export const HOSPITAL_TIERS = [
    { value: "None", price: 0},
    { value: "Basic", price: 90},
    { value: "Bronze", price: 120},
    { value: "Silver", price: 160},
    { value: "Gold", price: 220},
];

export const EXTRA_TIERS = [
    { value :"None", price: 0},
    { value :"Basic", price: 25},
    { value :"Standard", price: 45},
    { value :"Premium", price: 70},
];

export const COVER_HISTORIES = [
    { value: "Yes", label: "Yes, has held hospital cover before"},
    { value: "No", label: "No, has never held hospital cover before"},
    { value: "Not sure", label: "Not sure"},
];

export const PAYMENT_FREQUENCIES = [
    { value: "Monthly", label: "Monthly", hint: "No discount"},
    { value: "Yearly", label: "Yearly", hint: "Annual discount up to 10%"},
];

export const EMPTY_FORM = {
    customer_name: "",
    cover_type: "Single",
    applicant1_age: "",
    applicant1_cover_history: "",
    applicant2_age: "",
    applicant2_cover_history: "",
    hospital_cover: "",
    extras_cover: "",
    payment_frequency: "Monthly",
    annual_discount: "0",
    notes: "",
};

export const needsApplicant2 = (coverType) => coverType === "Couple" || coverType === "Family";

const isBlank = (v) => String(v ?? "").trim() == "";

function checkAge(value, label){
    if (isBlank(value)){
        return `Enter ${label}'s age.`;
    };
    const age = Number(value);
    if (!Number.isInteger(age)){
        return `${label}'s age must be a whole number.`;
    };
    if (age < MIN_AGE || age > MAX_AGE){
        return `${label}'s age must be between ${MIN_AGE} and ${MAX_AGE}.`;
    };
    return null;
};

export function validateForm(v){
    const errors = {};
    if (isBlank(v.customer_name)){
        errors.customer_name = "Enter customer's name.";
    }
    else if (v.customer_name.trim().length > MAX_NAME_LENGTH){
        errors.customer_name = `Keep the name to ${MAX_NAME_LENGTH} characters or fewer.`;
    };

    if (!COVER_TYPES.some((o) => o.value === v.cover_type)){
        errors.cover_type = "Choose a cover type.";
    };

    const age1 = checkAge(v.applicant1_age, "Applicant 1");
    if (age1){
        errors.applicant1_age = age1;
    };
    if (isBlank(v.applicant1_cover_history)){
        errors.applicant1_cover_history = "Choose Applicant 1's cover history."
    };

    if (needsApplicant2(v.cover_type)){
        const age2 = checkAge(v.applicant2_age, "Applicant 2");
        if (age2){
            errors.applicant2_age = age2;
        };
        if (isBlank(v.applicant2_cover_history)){
            errors.applicant2_cover_history = `Choose Applicant 2's cover history; required for ${v.cover_type} cover.`;
        };
    };

    if (isBlank(v.hospital_cover)){
        errors.hospital_cover = "Choose a hospital cover level.";
    };
    if (isBlank(v.extras_cover)){
        errors.extras_cover = "Choose an extras cover level.";
    };
    if (v.hospital_cover === "None" && v.extras_cover === "None"){
        errors.cover_selection = "Choose at least one of the hospital or extras cover."
    };

    if (v.payment_frequency === "Yearly"){
        if (isBlank(v.annual_discount)){
            errors.annual_discount = `Enter an annual discount between ${MIN_DISCOUNT}% and ${MAX_DISCOUNT}%.`
        }
        else {
            const d = Number(v.annual_discount);
            if (!Number.isFinite(d) || d < MIN_DISCOUNT || d > MAX_DISCOUNT){
                errors.annual_discount = `Value must be between ${MIN_DISCOUNT}% and ${MAX_DISCOUNT}%.`
            };
        };
    }
    else if (v.payment_frequency !== "Monthly"){
        errors.payment_frequency = "Choose how the customer will pay.";
    };

    if ((v.notes ?? "").length > MAX_NOTES_LENGTH){
        errors.notes = `Keep notes to ${MAX_NOTES_LENGTH} characters or fewer.`;
    };

    return errors;
};

export function toPayLoad(v){
    const two = needsApplicant2(v.cover_type);
    const yearly = v.payment_frequency === "Yearly";
    return {
        customer_name: v.customer_name.trim(),
        cover_type: v.cover_type,
        applicant1_age: Number(v.applicant1_age),
        applicant1_cover_history: v.applicant1_cover_history,
        applicant2_age: two ? Number(v.applicant2_age): null,
        applicant2_cover_history: two ? v.applicant2_cover_history: null,
        hospital_cover: v.hospital_cover,
        extras_cover: v.extras_cover,
        payment_frequency: v.payment_frequency,
        annual_discount: yearly ? Number(v.annual_discount) : 0,
        notes: v.notes.trim(),
    };
};

export function fromQuote(q){
    const str = (x) => (x == null ? "": String(x));
    return {
        customer_name: str(q.customer_name),
        cover_type: q.cover_type,
        applicant1_age: str(q.applicant1_age),
        applicant1_cover_history: str(q.applicant1_cover_history),
        applicant2_age: str(q.applicant2_age),
        applicant2_cover_history: str(q.applicant2_cover_history),
        hospital_cover: q.hospital_cover,
        extras_cover: q.extras_cover,
        payment_frequency: q.payment_frequency,
        annual_discount: str(q.annual_discount ?? 0),
        notes: str(q.notes),
    };
};