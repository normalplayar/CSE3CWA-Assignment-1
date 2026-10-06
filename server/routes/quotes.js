"use strict";

const express = require("express");
const { validateQuote } = require("../validateQuote");
const { calculateQuote } = require("../quoteCalculator");

function safeCalculate(row){
    try {
        return calculateQuote(row);
    }
    catch (err) {
        console.error(`Could not calculate quote ${row.id}: `,err.message);
        return null;
    };
};

function parseId(raw){
    return /^[1-9]\d*$/.test(raw) ? Number(raw) : null;
};

const invalidId = (res) => res.status(400).json({ errors: {_form: "Quote id must be a positive whole number."}});
const notFound = (res, id) => res.status(404).json({ errors: {_form: `Quote ${id} was not found.`}});

function createQuotesRouter(repo){
    const router = express.Router();

    router.get("/", (req, res) => {
        const items = repo.list().map((row) => {
            const breakdown = safeCalculate(row);
            return {
                id: row.id,
                customer_name: row.customer_name,
                cover_type: row.cover_type,
                hospital_cover: row.hospital_cover,
                extras_cover: row.extras_cover,
                payment_frequency: row.payment_frequency,
                created_at: row.created_at,
                monthlyPremium: breakdown ? breakdown.monthlyPremium : null,
                finalTotal: breakdown ? breakdown.finalTotal : null,
                finalTotalFrequency: breakdown ? breakdown.finalTotalFrequency : null,
                hasWarnings : breakdown ? breakdown.warnings.length > 0 : false,
            };
        });
        res.json(items);
    });

    router.get("/:id", (req, res) => {
        const id = parseId(req.params.id);
        if (id === null){
            return invalidId(res);
        };
        const row = repo.getById(id);
        if (!row){
            return notFound(res, id);
        };

        res.json({ quote: row, breakdown: safeCalculate(row)});
    });

    router.post("/", (req, res) => {
        const { valid, errors, data} = validateQuote(req.body);
        if (!valid){
            return res.status(400).json({ errors });
        };

        const row = repo.create(data);
        res.status(201).json({ quote: row, breakdown: safeCalculate(row)});
    });

    router.put("/:id", (req, res) => {
        const id = parseId(req.params.id);
        if (id === null){
            return invalidId(res);
        };
        if (!repo.getById(id)){
            return notFound(res, id);
        };

        const { valid, errors, data } = validateQuote(req.body);
        if (!valid){
            return res.status(400).json({ errors });
        };

        const row = repo.update(id, data);
        res.json({ quote: row, breakdown: safeCalculate(row)});
    });

    router.delete("/:id", (req, res) => {
        const id = parseId(req.params.id);
        if (id === null){
            return invalidId(res);
        };
        if (!repo.remove(id)){
            return notFound(res, id);
        };

        res.status(204).end();
    });

    return router;
};

module.exports = {
    createQuotesRouter,
    parseId,
};