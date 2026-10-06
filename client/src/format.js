const currency = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
});

export function money(amount){
    return amount == null ? "-" : currency.format(amount);
};

export function formatDate(sqliteDate){
    if (!sqliteDate){
        return "";
    };
    const date = new Date(sqliteDate.replace(" ", "T") + "Z");
    return date.toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

export function describeCover(hospital, extras){
    if (hospital === "None"){
        return `Extras only (${extras})`;
    };
    if (extras === "None"){
        return `Hospital only (${hospital})`;
    };
    return `${hospital} hospital, ${extras} extras`
}