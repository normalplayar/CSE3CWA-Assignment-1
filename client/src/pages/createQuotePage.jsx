import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuoteForm from '../components/quoteForm.jsx';
import {createQuote} from "../api.js";
import { EMPTY_FORM } from "../quoteForm.js";

export default function CreateQuotePage(){
    const navigate = useNavigate();
    const [initial, setInitial] = useState(EMPTY_FORM);
    const [formKey, setFormKey] = useState(0);

    async function handleSubmit(payload) {
        const { quote } = await createQuote(payload);
        navigate(`/quotes/${quote.id}`);
    };

    return (
        <>
            <div className="page_heading">
                <h1>New quote</h1>
            </div>
            <QuoteForm
                key={formKey}
                initialValues={initial}
                submitLabel="Save quote"
                onSubmit={handleSubmit}
                onCancel={() => navigate("/")}
            />
        </>
    )
}