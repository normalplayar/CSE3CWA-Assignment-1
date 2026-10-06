"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "healthcoversim.db");
const INIT_SQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");

function openDatabase(file = DB_PATH){
    const db = new Database(file);
    db.exec(INIT_SQL);
    return db;
};

module.exports = {
    openDatabase,
    DB_PATH,
};

if (require.main === module){
    const db = openDatabase();
    const { count } = db.prepare(`SELECT COUNT(*) AS count FROM quotes`).get();
    console.log(`Database is ready at ${DB_PATH} (${count} quotes${count === 1 ? "" : "s"})`);
    db.close();
};