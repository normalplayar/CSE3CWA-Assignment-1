"use strict";

const express = require("express");
const cors = require("cors");
const { openDatabase } = require("./db");
const { createQuoteRepo } = require("./quoteRepo");
const { createQuotesRouter } = require("./routes/quotes");

const PORT = Number(process.env.PORT) || 3001;

function createApp(db){
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "10kb" }));
    app.get("/api/health", (req, res) => res.json({status: "ok"}));
    app.use("/api/quotes", createQuotesRouter(createQuoteRepo(db)));

    app.use((req, res) => {
        res.status(404).json({ errors: {_form: `No route for ${req.method} ${req.path}`}});
    });

    app.use((err, req, res, next) => {
        if (err.type === "entity.parse.failed"){
            return res.status(400).json({ errors: { _form: "Request body is not valid JSON."}});
        };
        if (err.type === "entity.too.large"){
            return res.status(413).json({ errors: { _form: "Request body is too large."}});
        };
        if (err.code && String(err.code).startsWith("SQLITE_CONSTRAIN")){
            return res.status(400).json({ errors: { _form: "Quote data breaks a database rule."}});
        };
        console.error(err);
        res.status(500).json({ errors: {_form: "Something went wrong with the server."}});
    });

    return app;
};

module.exports = {
    createApp,
};

if (require.main === module){
    const db = openDatabase();
    createApp(db).listen(PORT, () => {
        console.log(`HealthCoverSim API running at http://localhost:${PORT}/api/quotes`);
    });
};
