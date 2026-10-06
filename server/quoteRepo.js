"use strict";

const COLUMNS = [
    "customer_name",
    "cover_type",
    "applicant1_age",
    "applicant1_cover_history",
    "applicant2_age",
    "applicant2_cover_history",
    "hospital_cover",
    "extras_cover",
    "payment_frequency",
    "annual_discount",
    "notes",
];

function pickColumns(data){
    const row = {};
    for (const col of COLUMNS){
        row[col] = data[col] ?? null;
    };
    return row;
};

function createQuoteRepo(db){
    const statements = {
        list: db.prepare("SELECT * FROM quotes ORDER BY created_at DESC, id DESC"),
        getById: db.prepare("SELECT * FROM quotes WHERE id = @id"),
        insert: db.prepare(
            `INSERT INTO quotes (${COLUMNS.join(", ")})
            VALUES (${COLUMNS.map((c) => "@" + c).join(", ")})`
        ),
        update: db.prepare(
            `UPDATE quotes SET ${COLUMNS.map((c) => `${c} = @${c}`).join(", ")}
            WHERE id = @id`
        ),
        remove: db.prepare(`DELETE FROM quotes WHERE id = @id`),
    };

    return {
        list (){
            return statements.list.all();
        },

        getById(id){
            return statements.getById.get({ id });
        },

        create(data){
            const info = statements.insert.run(pickColumns(data));
            return statements.getById.get({ id: Number(info.lastInsertRowid)});
        },

        update(id, data){
            const info = statements.update.run({ ...pickColumns(data), id});
            return info.changes === 0 ? undefined : statements.getById.get({ id });
        },

        remove(id){
            return statements.remove.run({ id }).changes > 0;
        },
    };
}

module.exports = {
    createQuoteRepo,
    COLUMNS,
};