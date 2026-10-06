import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { getQuote, updateQuote } from '../api';
import { fromQuote } from '../quoteForm';
import QuoteForm from '../components/quoteForm';

export default function EditQuotePage(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [initial, setInitial] = useState(null);
    const [error, setErrors] = useState(null);

    useEffect(() => {
        getQuote(id).then(({ quote }) => setInitial(fromQuote(quote)))
        .catch((err) => setErrors(err));
    }, [id]);

    async function handleSubmit(payload) {
        await updateQuote(id, payload);
        navigate(`/quotes/${id}`);
    };

    if (error){
        return (
            <div className="notice">
                <h1>
                    {error.status === 404 ? "Quote not found" : "Couldn't load this quote"}
                </h1>
                <p>
                    {error.message}
                </p>
                <Link to="/">
                    Back to all quotes
                </Link>
            </div>
        );
    };
    if (!initial){
        return <p className="loading">Loading quote...</p>
    };

    return (
        <>
            <div className="page_heading">
                <h1>
                    Edit quote for {initial.customer_name}
                </h1>
            </div>
            <QuoteForm
                initialValues={initial}
                submitLabel="Save changes"
                onSubmit={handleSubmit}
                onCancel={() => navigate(`/quotes/${id}`)}
            />
        </>
    )
};