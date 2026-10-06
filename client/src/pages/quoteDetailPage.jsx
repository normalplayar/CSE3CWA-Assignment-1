import { useEffect, useState } from "react";
import {Link, useNavigate, useParams} from 'react-router-dom';
import { deleteQuote, getQuote } from "../api.js";
import { formatDate, money } from "../format.js";
import "./quoteDetailPage.css"

function Line({ label, working, amount, kind = "item"}){
    return (
        <tr className={`line line_${kind}`}>
            <th scope="row">
                {label}
            </th>
            <td className="working">
                {working}
            </td>
            <td className="num">
                {amount}
            </td>
        </tr>
    );
};

function Statement({ b }){
    const hasHospital = b.hospitalCover !== "None";
    const hasExtras = b.extrasCover !== "None";
    const isYearly = b.paymentFrequency === "Yearly";
    const adults = `${b.adultCount} adult${b.adultCount > 1 ? "s" : ""}`;

    return(
        <table className="statement">
            <caption className="visually_hidden">
                Itemised premium breakdown
            </caption>
            <thead>
                <tr>
                    <th scope="col">
                        Item
                    </th>
                    <th scope="col">
                        How it's worked out
                    </th>
                    <th scope="col" className="num">
                        Amount
                    </th>
                </tr>
            </thead>

            <tbody className="statement_group">
                <tr className="group_heading">
                    <th colSpan={3} scope="rowgroup">
                        Hospital cover: {b.hospitalCover}
                    </th>
                </tr>
                {hasHospital ? (
                    <>
                        {b.applicants.map((a) => (
                            <Line
                                key={a.label}
                                label={a.label}
                                working={
                                    a.LHCLoadingPercent > 0 ? `${money(a.hospitalBase)} + ${a.LHCLoadingPercent}% LHC loading`
                                    : `${money(a.hospitalBase)}, no LHC loading`
                                }
                                amount={money(a.hospitalPremium)}
                            />
                        ))}
                        <Line label="Hospital premium" working="per month" amount={money(b.hospitalTotal)} kind="subtotal"/>
                    </>
                ) : (
                    <Line label="Hospital premium" working="No hospital cover selected" amount={money(0)} kind="subtotal"/>
                )}
            </tbody>

            <tbody className="statement_group">
                <tr className="group_heading">
                    <th colSpan={3} scope="rowgroup">
                        Extras cover: {b.extrasCover}
                    </th>
                </tr>
                <Line
                    label="Extras premium"
                    working={
                        hasExtras
                        ? `${money(b.extrasPerAdult)} x ${adults}, per month (no LHC loading)`
                        : "No extras cover selected"
                    }
                    amount={money(b.extrasTotal)}
                    kind="subtotal"
                />
            </tbody>

            {b.familyFee > 0 && (
                <tbody className="statement_group">
                    <Line
                        label="Family upgrade fee"
                        working="Added once, per month to cover children"
                        amount={money(b.familyFee)}
                        kind="subtotal"
                    />
                </tbody>
            )}

            <tbody className="statement_group statement_totals">
                <Line
                    label="Monthly premium"
                    working={[b.hospitalTotal, b.extrasTotal, b.familyFee]
                        .filter((x) => x > 0)
                        .map(money).join(" + ")
                    }
                    amount={money(b.monthlyPremium)}
                    kind="total"
                />
                <Line
                    label="Yearly premium before discount"
                    working={`${money(b.monthlyPremium)} x 12`}
                    amount={money(b.yearlyBefore)}
                    kind="total"
                />
                {isYearly && (
                    <>
                        <Line
                            label="Annual-payment discount"
                            working={`${b.annualDiscount}% of ${money(b.yearlyBefore)}`}
                            amount={`-${money(b.discountAmount)}`}
                        />
                        <Line
                            label="Yearly premium after discount"
                            working={`${money(b.yearlyBefore)} - ${money(b.discountAmount)}`}
                            amount={money(b.yearlyAfter)}
                            kind="grand"
                        />
                    </>
                )}
            </tbody>
        </table>
    );
};

function LHCTable({ b }){
    const hasHospital = b.hospitalCover !== "None";
    return (
        <section className="detail_section">
            <h2>Lifetime Health Cover loading</h2>
            <p className="lhc_statement">{b.LHCStatement}</p>
            {!hasHospital && <p className="section_note">No hospital cover is selected, so no applicant has a loading.</p>}
            <div className="table_scroll">
                <table className="data_table lhc_table">
                <thead>
                    <tr>
                        <th scope="col">Applicant</th>
                        <th scope="col" className="num">
                            Age
                        </th>
                        <th scope="col">Held hospital cover before</th>
                        <th scope="col" className="num">
                            LHC loading
                        </th>
                        <th scope="col" className="num">
                            Hospital premium / month
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {b.applicants.map((a) => (
                    <tr key={a.label}>
                        <th scope="row">{a.label}</th>
                        <td className="num">{a.age}</td>
                        <td>{a.coverHistory}</td>
                        <td className="num">{a.LHCLoadingPercent}%</td>
                        <td className="num">{money(a.hospitalPremium)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>     
        </section>
    );
};

function QuoteInputs({ quote }){
    const two = quote.applicant2_age != null;
    const applicant = (age, history) => `Age ${age}, held hospital cover before: ${history}`;
    return (
        <section className="detail_section">
        <h2>Quote details</h2>
        <dl className="inputs">
            <dt>Cover type</dt>
            <dd>{quote.cover_type}</dd>
            <dt>Applicant 1</dt>
            <dd>{applicant(quote.applicant1_age, quote.applicant1_cover_history)}</dd>
            {two && (
                <>
                    <dt>Applicant 2</dt>
                    <dd>{applicant(quote.applicant2_age, quote.applicant2_cover_history)}</dd>
                </>
            )}
            <dt>Hospital cover</dt>
            <dd>{quote.hospital_cover}</dd>
            <dt>Extras cover</dt>
            <dd>{quote.extras_cover}</dd>
            <dt>Payment</dt>
            <dd>
                {quote.payment_frequency}
                {quote.payment_frequency === "Yearly" && `, ${quote.annual_discount}% annual discount`}
            </dd>
            <dt>Notes</dt>
            <dd>{quote.notes || "None"}</dd>
            <dt>Created</dt>
            <dd>{formatDate(quote.created_at)}</dd>
        </dl>
        </section>
    );
};

export default function QuoteDetailPage(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setData(null);
        getQuote(id)
        .then(setData)
        .catch((err) => setError(err));
    }, [id]);

    async function handleDelete() {
        if (!window.confirm(`Delete the quote for ${data.quote.customer_name}? This can't be undone.`)){
            return;
        };
        try {
            await deleteQuote(id);
            navigate("/");
        }
        catch (err){
            setError(err);
        };
    };

    if (error) {
        return (
        <div className="notice">
            <h1>{error.status === 404 ? "Quote not found" : "Couldn't load this quote"}</h1>
            <p>{error.message}</p>
            <Link to="/">Back to all quotes</Link>
        </div>
        );
    };

    if (!data){
        return <p className="loading">Loading quote...</p>
    };

    const {quote, breakdown: b} = data;
    const isYearly = b?.paymentFrequency === "Yearly";

    return(
        <article className="quote_detail">
            <div className="page_heading">
                <div>
                    <Link to="/" className="back_link">
                        All quotes
                    </Link>
                    <h1>
                        {quote.customer_name}
                    </h1>
                </div>
                <div className="heading_actions">
                    <Link to={`/quotes/${id}/edit`} className="button">
                        Edit
                    </Link>
                    <button type="button" className="button button_danger" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>
            {!b ? (
                <div className="form_alert" role="alert">
                <p>This quote's details are incomplete, so a premium can't be calculated. Edit the quote to fix it.</p>
                </div>
            ) : (
                <>
                {b.warnings.length > 0 && (
                    <div className="warnings" role="status">
                    <h2>This quote may be inaccurate</h2>
                    <ul>
                        {b.warnings.map((w) => (
                        <li key={w}>{w}</li>
                        ))}
                    </ul>
                    </div>
                )}

                <section className="summary" aria-label="Premium summary">
                    <div className="summary_main">
                    <p className="summary_label">
                        {isYearly ? "Customer pays per year" : "Customer pays per month"}
                    </p>
                    <p className="summary_amount">{money(b.finalTotal)}</p>
                    <p className="summary_note">
                        {isYearly
                        ? `Paid yearly, so the ${b.annualDiscount}% annual-payment discount is applied to the yearly premium.`
                        : "Paid monthly, so the annual-payment discount does not apply."}
                    </p>
                    </div>
                    <dl className="summary_figures">
                    <div>
                        <dt>Monthly premium</dt>
                        <dd>{money(b.monthlyPremium)}</dd>
                    </div>
                    <div>
                        <dt>Yearly before discount</dt>
                        <dd>{money(b.yearlyBefore)}</dd>
                    </div>
                    {isYearly && (
                        <div>
                        <dt>Yearly after {b.annualDiscount}% discount</dt>
                        <dd>{money(b.yearlyAfter)}</dd>
                        </div>
                    )}
                    </dl>
                </section>

                <section className="detail_section">
                    <h2>Premium breakdown</h2>
                    <Statement b={b} />
                </section>

                <LHCTable b={b} />

                <section className="detail_section">
                    <h2>How this quote was calculated</h2>
                    <ol className="explanation">
                    {b.explanation.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                    </ol>
                </section>
                </>
            )}

            <QuoteInputs quote={quote} />
        </article>
    )
}

