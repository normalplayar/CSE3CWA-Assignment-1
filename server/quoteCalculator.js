"use strict";

const HOSPITAL_PRICES = {
    None: 0,
    Basic: 9000,
    Bronze: 12000,
    Silver: 16000,
    Gold: 22000,
};
const EXTRAS_PRICES = {
    None: 0,
    Basic: 2500,
    Standard: 4500,
    Premium: 7000,
};
const ADULT_COUNT = {
    Single: 1,
    Couple: 2,
    Family: 2,
};
const COVER_HISTORIES = ["Yes", "No", "Not sure"];
const PAYMENT_FREQUENCIES = ["Monthly", "Yearly"];

const FAMILY_FEE = 3000;
const LHC_THERESHOLD_AGE = 30;
const LHC_PERCENT_PER_YEAR = 2;
const LHC_STATEMENT = "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover."

const currency = new Intl.NumberFormat("en-AU", {style: "currency", currency: "AUD"})
const formating = (cents) => currency.format(cents / 100);
const toDollars = (cents) => cents / 100;

function lookUp(table, key, fieldName) {
    if (!Object.prototype.hasOwnProperty.call(table,key)){
        throw new Error(`Invalid ${fieldName}: ${key}`)
    }
    return table[key];
};

function calculateLHCLoadingPercent(age, coverHistory, hospitalSelected){
    if (!hospitalSelected){
        return 0;
    };
    if (coverHistory !== "No"){
        return 0;
    };
    if (age <= LHC_THERESHOLD_AGE){
        return 0;
    };
    return (age - LHC_THERESHOLD_AGE) * LHC_PERCENT_PER_YEAR;
};

function describeLoading(applicant, hospitalTier, hospitalSelected){
    const { label, age, coverHistory, loadingPercent, hospitalCents } = applicant;
    if (!hospitalSelected){
        return `${label} (age ${age}): no hospital cover selected; no LHC loading applies.`;
    };
    if (coverHistory === "Yes"){
        return `${label} (age ${age}, had hospital cover before): LHC loading 0%, hospital = ${formating(hospitalCents)}.`;
    };
    if (coverHistory === "Not sure"){
        return `${label} (age ${age}, cover history unknown): LHC loading not applied (0%), hospital = ${formating(hospitalCents)}.`;
    };
    if (age <= LHC_THERESHOLD_AGE){
        return `${label} (age ${age}, no prior cover): aged 30 or under; LHC loading is 0%, hospital = ${formating(hospitalCents)}.`;
    };
    return (`${label} (age ${age}, no prior hospital cover): LHC loading = (${age} - 30) x 2% = ${loadingPercent}%; ` +
           `hospital = ${formating(hospitalTier)} + ${loadingPercent}% = ${formating(hospitalCents)}.`);
};

function calculateQuote(quote){
    if (!quote || typeof quote !== "object"){
        throw new Error ("Quote data is required.");
    };

    const coverType = quote.cover_type;
    const adultCount = lookUp(ADULT_COUNT, coverType, "cover type");
    const hospitalTier = lookUp(HOSPITAL_PRICES, quote.hospital_cover, "hospital cover");
    const extrasTier = lookUp(EXTRAS_PRICES, quote.extras_cover, "extras cover");
    const paymentFrequency = quote.payment_frequency;
    if (!PAYMENT_FREQUENCIES.includes(paymentFrequency)){
        throw new Error(`Invalid payment frequency: ${paymentFrequency}.`);
    };
    const hospitalSelected = hospitalTier > 0;

    const rawApplicants = [{
        age: quote.applicant1_age,
        coverHistory: quote.applicant1_cover_history
    }];
    if (adultCount === 2){
        if (quote.applicant2_age == null || quote.applicant2_cover_history == null){
            throw new Error(`Applicant 2 age and cover history are required for ${coverType} cover.`);
        };
        rawApplicants.push({
            age: quote.applicant2_age,
            coverHistory: quote.applicant2_cover_history
        });
    };

    const warnings = [];
    const applicants = rawApplicants.map((raw, i) => {
        const label = `Applicant ${i + 1}`;
        const age = Number(raw.age);
        if (!Number.isFinite(age)){
            throw new Error(`${label}: age is missing or not a number.`);
        };
        if (!COVER_HISTORIES.includes(raw.coverHistory)){
            throw new Error(`${label}: invalid cover history: ${raw.coverHistory}.`);
        };

        const loadingPercent = calculateLHCLoadingPercent(age, raw.coverHistory, hospitalSelected);
        const hospitalCents = Math.round((hospitalTier * (100 + loadingPercent)) / 100);

        if (raw.coverHistory === "Not sure"){
            warnings.push(
                `${label}: Cover history is unknown; LHC loading has not been applied. This quote may be inaccurate.`
            );
        };

        return {label, age, coverHistory: raw.coverHistory, loadingPercent, hospitalCents};
    });

    const hospitalTotal = applicants.reduce((sum, a) => sum + a.hospitalCents, 0);
    const extrasTotal = extrasTier * adultCount;
    const familyFee = coverType === "Family" ? FAMILY_FEE : 0;
    const monthly = hospitalTotal + extrasTotal + familyFee;
    const yearly = monthly * 12;

    const isYearly = paymentFrequency === "Yearly";
    const discountPercent = isYearly ? Number(quote.annual_discount ?? 0) : 0;
    const discount = isYearly ? Math.round((yearly * discountPercent) / 100) : 0;
    const yearlyAfter = isYearly ? yearly - discount : null;

    const explanation = [];
    explanation.push(
        `${coverType} cover: ${adultCount} adult${adultCount > 1 ? "s are" : " is"} priced individually.`
    );

    if (hospitalSelected){
        explanation.push(
            `Hospital cover (${quote.hospital_cover}) costs ${formating(hospitalTier)} per adult per month before LHC loading.`
        );
    };

    applicants.forEach((a) => explanation.push(describeLoading(a, hospitalTier, hospitalSelected)));
    if (hospitalSelected){
        const parts = applicants.map((a) => formating(a.hospitalCents)).join(" + ");
        explanation.push(
            adultCount > 1 ? `Hospital total: ${parts} = ${formating(hospitalTotal)} per month.` :
            `Hospital total: ${formating(hospitalTotal)} per month.`
        );
    };

    explanation.push(
        extrasTier > 0 ? `Extra cover (${quote.extras_cover}): ${formating(extrasTier)} x ${adultCount} adult${adultCount > 1 ? "s": ""} = ${formating(extrasTotal)} per month (no LHC loading on extras).` :
        `No extras cover selected.`
    );

    if (familyFee > 0){
        explanation.push(`Family upgrade fee: ${formating(familyFee)} per month, added once to cover dependent children.`);
    };

    const monthlyParts = [hospitalTotal, extrasTotal, familyFee].filter((c) => c > 0).map(formating);
    explanation.push(`Monthly premium = ${monthlyParts.length ? monthlyParts.join(" + "): formating(0)} = ${formating(monthly)}.`);
    explanation.push(`Yearly premium before discount = ${formating(monthly)} x 12 = ${formating(yearly)}.`);
    explanation.push(
        isYearly ? `Paying yearly with a ${discountPercent}% annual-payment discount: ${formating(yearly)} - ${formating(discount)} = ${formating(yearlyAfter)}.` :
        "Paying monthly; annual-payment discount does not apply."
    );

    return {
        coverType,
        adultCount,
        paymentFrequency,
        hospitalCover: quote.hospital_cover,
        extrasCover: quote.extras_cover,
        applicants: applicants.map((a) => ({
            label: a.label,
            age: a.age,
            coverHistory: a.coverHistory,
            LHCLoadingPercent: a.loadingPercent,
            hospitalBase: toDollars(hospitalTier),
            hospitalPremium: toDollars(a.hospitalCents),
        })),
        hospitalTotal: toDollars(hospitalTotal),
        extrasPerAdult: toDollars(extrasTier),
        extrasTotal: toDollars(extrasTotal),
        familyFee: toDollars(familyFee),
        monthlyPremium: toDollars(monthly),
        yearlyBefore: toDollars(yearly),
        annualDiscount: discountPercent,
        discountAmount: toDollars(discount),
        yearlyAfter: yearlyAfter === null ? null : toDollars(yearlyAfter),
        finalTotal: isYearly ? toDollars(yearlyAfter) : toDollars(monthly),
        finalTotalFrequency: isYearly ? "per year" : "per month",
        warnings,
        LHCStatement: LHC_STATEMENT,
        explanation
    };
};

module.exports = {
    calculateQuote,
    calculateLHCLoadingPercent,
    HOSPITAL_PRICES,
    EXTRAS_PRICES,
    ADULT_COUNT,
    COVER_HISTORIES,
    PAYMENT_FREQUENCIES,
    LHC_STATEMENT,
};
