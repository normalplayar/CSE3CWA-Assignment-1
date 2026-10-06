'use strict';

// End-to-end API tests against an in-memory database.
// Run with:  node --test   (after npm install)
const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('./db');
const { createApp } = require('./server');

const example = {
  customer_name: 'Jane Citizen',
  cover_type: 'Family',
  applicant1_age: 40,
  applicant1_cover_history: 'No',
  applicant2_age: 35,
  applicant2_cover_history: 'Yes',
  hospital_cover: 'Silver',
  extras_cover: 'Standard',
  payment_frequency: 'Yearly',
  annual_discount: 5,
  notes: 'Section 7 worked example',
};

let server;
let base;

test.before(async () => {
  const app = createApp(openDatabase(':memory:'));
  await new Promise((resolve) => {
    server = app.listen(0, resolve); // port 0 = any free port
  });
  base = `http://localhost:${server.address().port}/api/quotes`;
});

test.after(() => server.close());

async function call(method, path = '', body, rawBody) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

test('Full CRUD cycle with the Section 7 example', async () => {
  // Create
  const created = await call('POST', '', example);
  assert.equal(created.status, 201);
  const id = created.body.quote.id;
  assert.ok(id > 0);
  assert.ok(created.body.quote.created_at);
  assert.equal(created.body.breakdown.monthlyPremium, 472);
  assert.equal(created.body.breakdown.yearlyAfter, 5380.8);

  // List
  const list = await call('GET');
  assert.equal(list.status, 200);
  const item = list.body.find((q) => q.id === id);
  assert.equal(item.customer_name, 'Jane Citizen');
  assert.equal(item.monthlyPremium, 472);

  // Detail
  const detail = await call('GET', `/${id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.quote.notes, 'Section 7 worked example');
  assert.equal(detail.body.breakdown.applicants[0].LHCLoadingPercent, 20);

  // Update: change to Single, Monthly → applicant 2 cleared, discount ignored
  const updated = await call('PUT', `/${id}`, { ...example, cover_type: 'Single', payment_frequency: 'Monthly' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.quote.applicant2_age, null);
  assert.equal(updated.body.quote.applicant2_cover_history, null);
  assert.equal(updated.body.quote.annual_discount, 0);
  assert.equal(updated.body.breakdown.monthlyPremium, 192 + 45); // loaded hospital + extras, no family fee

  // Delete
  const deleted = await call('DELETE', `/${id}`);
  assert.equal(deleted.status, 204);
  assert.equal((await call('GET', `/${id}`)).status, 404);
  assert.equal((await call('DELETE', `/${id}`)).status, 404);
});

test('Invalid input returns 400 with field errors, and nothing is saved', async () => {
  const before = (await call('GET')).body.length;
  const res = await call('POST', '', { ...example, applicant1_age: 150, annual_discount: 20, cover_type: 'Couple', applicant2_age: null });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.applicant1_age);
  assert.ok(res.body.errors.annual_discount);
  assert.ok(res.body.errors.applicant2_age);
  assert.equal((await call('GET')).body.length, before);
});

test('Invalid update returns 400 and leaves the quote unchanged', async () => {
  const id = (await call('POST', '', example)).body.quote.id;
  const res = await call('PUT', `/${id}`, { ...example, customer_name: '' });
  assert.equal(res.status, 400);
  assert.equal((await call('GET', `/${id}`)).body.quote.customer_name, 'Jane Citizen');
});

test('Bad ids return 400, unknown ids return 404', async () => {
  for (const bad of ['abc', '0', '-1', '1.5']) {
    assert.equal((await call('GET', `/${bad}`)).status, 400, `GET /${bad}`);
  }
  assert.equal((await call('GET', '/999999')).status, 404);
  assert.equal((await call('PUT', '/999999', example)).status, 404);
});

test('Garbage requests never cause a 500', async () => {
  assert.equal((await call('POST', '', undefined, '{not json')).status, 400);
  assert.equal((await call('POST', '', undefined, '"just a string"')).status, 400);
  assert.equal((await call('POST', '', [])).status, 400);
  assert.equal((await call('POST', '', {})).status, 400);
  assert.equal((await call('POST', '')).status, 400); // no body at all
  assert.equal((await call('GET', '/../../etc')).status, 404);
});

test('SQL injection attempts are stored as plain text', async () => {
  const name = "Robert'); DROP TABLE quotes;--";
  const res = await call('POST', '', { ...example, customer_name: name });
  assert.equal(res.status, 201);
  assert.equal(res.body.quote.customer_name, name);
  assert.equal((await call('GET')).status, 200); // table still exists
});