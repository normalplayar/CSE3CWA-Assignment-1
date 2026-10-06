import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteQuote, listQuotes } from "../api.js";
import { describeCover, formatDate, money } from "../format.js";
import "./quoteListPage.css";

export default function QuoteListPage(){
    const [quotes, setQuotes] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        listQuotes()
        .then(setQuotes)
        .catch((err) => setError(err.message));
    }, []);

    async function handleDelete(quote) {
        if (!window.confirm(`Delete the quote for ${quote.customer_name}? This can't be undone.`)) return;
        try {
        await deleteQuote(quote.id);
        setQuotes((qs) => qs.filter((q) => q.id !== quote.id));
        } 
        catch (err) {
        setError(err.message);
        };
    };

    return (
        <>
            <div className="page_heading">
                <h1>Quotes</h1>
                <Link to="/quotes/new" className="button button_primary">
                    New quote
                </Link>
            </div>

            {error && (
                <div className="form_alert" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {!quotes && !error && <p className="loading">Loading quotes…</p>}

            {quotes && quotes.length === 0 && (
                <div className="notice">
                <h2>No quotes yet</h2>
                <p>Create a quote to see its premium breakdown here.</p>
                <Link to="/quotes/new" className="button button_primary">
                    Create the first quote
                </Link>
                </div>
            )}

            {quotes && quotes.length > 0 && (
                <div className="table_scroll">
                <table className="data_table quote_table">
                    <thead>
                    <tr>
                        <th scope="col">Customer</th>
                        <th scope="col">Cover</th>
                        <th scope="col" className="num">
                        Monthly
                        </th>
                        <th scope="col" className="num">
                        Customer pays
                        </th>
                        <th scope="col">Created</th>
                        <th scope="col">
                        <span className="visually_hidden">Actions</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {quotes.map((q) => (
                        <tr key={q.id}>
                        <td>
                            <Link to={`/quotes/${q.id}`} className="customer_link">
                            {q.customer_name}
                            </Link>
                            {q.hasWarnings && <span className="tag tag_warning">Cover history unknown</span>}
                        </td>
                        <td>
                            {q.cover_type}
                            <span className="cell_sub">{describeCover(q.hospital_cover, q.extras_cover)}</span>
                        </td>
                        <td className="num">{money(q.monthlyPremium)}</td>
                        <td className="num">
                            {money(q.finalTotal)}
                            <span className="cell_sub">{q.finalTotalFrequency}</span>
                        </td>
                        <td className="cell_date">{formatDate(q.created_at)}</td>
                        <td className="row_actions">
                            <Link to={`/quotes/${q.id}`}>View</Link>
                            <Link to={`/quotes/${q.id}/edit`}>Edit</Link>
                            <button type="button" className="link_button danger" onClick={() => handleDelete(q)}>
                            Delete
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </>
    );

}