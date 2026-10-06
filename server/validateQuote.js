"use strict";

const {
    HOSPITAL_PRICES,
    EXTRAS_PRICES,
    ADULT_COUNT,
    COVER_HISTORIES,
    PAYMENT_FREQUENCIES,
} = require("./quoteCalculator");

const MIN_AGE = 18;
const MAX_AGE = 100;
const MIN_DISCOUNT = 0;
const MAX_DISCOUNT = 10;
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 1000;
const isBlank = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function toNumber (v) {
    if (typeof v === "number"){
        return v;
    };
    if (typeof v === "string" && v.trim() !== ""){
        return Number(v.trim());
    };
    return NaN
};

function checkOption(errors, field, value, options, label){
    if (isBlank(value)){
        errors[field] = `${label} is required.`;
    } 
    else if (!options.includes(value)){
        errors[field] = `${label} must be one of: ${options.join(", ")}.`;
    };
};

function checkAge(errors, field, value, label){
    if (isBlank(value)){
        errors[field] = `${label} age is required.`;
        return null;
    };
    const age = toNumber(value);
    if(!Number.isInteger(age)){
        errors[field] = `${label} age must be a whole number.`;
        return null;
    };
    if (age < MIN_AGE || age > MAX_AGE){
        errors[field] = `${label} age must be between ${MIN_AGE} and ${MAX_AGE}.`;
        return null;
    };
    return age;
};

function validateQuote(input){
    if (!input || typeof input !== "object" || Array.isArray(input)){
        return {
            valid: false,
            errors: {_form: "Quote data must be a JSON object."},
            data: null,
        };
    };
    
    const errors = {};

    let customerName = null;
    if (typeof input.customer_name !== "string" || input.customer_name.trim() === ""){
        errors.customer_name = "Customer name is required.";
    }
    else if (input.customer_name.trim().length > MAX_NAME_LENGTH){
        errors.customer_name = `Customer name must be ${MAX_NAME_LENGTH} characters or fewer.`;
    }
    else {
        customerName = input.customer_name.trim();
    };

    checkOption(errors, "cover_type", input.cover_type, Object.keys(ADULT_COUNT), "Cover type");
    checkOption(errors, "hospital_cover", input.hospital_cover, Object.keys(HOSPITAL_PRICES), "Hospital cover");
    checkOption(errors, "extras_cover", input.extras_cover, Object.keys(EXTRAS_PRICES), "Extras cover");
    checkOption(errors, "payment_frequency", input.payment_frequency, (PAYMENT_FREQUENCIES), "Payment frequency");

    if (input.hospital_cover === "None" && input.extras_cover === "None"){
        errors._form = "Please select at least one of the hospital cover or extras cover.";
    };

    const age1 = checkAge(errors, "applicant1_age", input.applicant1_age, "Applicant 1");
    checkOption(errors, "applicant1_cover_history", input.applicant1_cover_history, COVER_HISTORIES, "Applicant 1 cover history");
    const history1 = input.applicant1_cover_history;

    const needsApplicant2 = input.cover_type === "Couple" || input.cover_type === "Family";
    let age2 = null;
    let history2 = null;
    if (needsApplicant2){
        age2 = checkAge(errors, "applicant2_age", input.applicant2_age, "Applicant 2");
        checkOption(errors, "applicant2_cover_history", input.applicant2_cover_history, COVER_HISTORIES, "Applicant 2 cover history");
        history2 = input.applicant2_cover_history;
    };

    let discount = 0;
    if (input.payment_frequency === "Yearly" && !isBlank(input.annual_discount)){
        const disc = toNumber(input.annual_discount);
        if (!Number.isFinite(disc)){
            errors.annual_discount = "Annual discount must be a number.";
        }
        else if (disc < MIN_DISCOUNT || disc > MAX_DISCOUNT){
            errors.annual_discount = `Annual discount must be between ${MIN_DISCOUNT}% and ${MAX_DISCOUNT}%.`;
        }
        else {
            discount = disc;
        };
    };

    let notes = null;
    if (!isBlank(input.notes)){
        if (typeof input.notes !== "string"){
            errors.notes = "Notes must be text.";
        }
        else if (input.notes.length > MAX_NOTES_LENGTH){
            errors.notes = `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`;
        }
        else {
            notes = input.notes.trim();
        };
    };

    if (Object.keys(errors).length > 0){
        return {
            valid: false,
            errors,
            data: null,
        };
    };

    return {
        valid: true,
        errors: {},
        data: {
            customer_name: customerName,
            cover_type: input.cover_type,
            applicant1_age: age1,
            applicant1_cover_history: history1,
            applicant2_age: age2,
            applicant2_cover_history: history2,
            hospital_cover: input.hospital_cover,
            extras_cover: input.extras_cover,
            payment_frequency: input.payment_frequency,
            annual_discount: discount,
            notes,
        },
    };
};

module.exports = {
    validateQuote,
    MIN_AGE,
    MAX_AGE,
    MIN_DISCOUNT,
    MAX_DISCOUNT,
};
