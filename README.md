# CSE3CWA-Assignment-1

## Install and run

After cloning the GitHub repository and opening the root folder, run these commands in different terminals

```bash
cd server
npm install
npm run init-db
npm start
```


```bash  
You should see

cd client
npm install
npm run dev
````

The will be on http://localhost:5173 and open it in a browser

## Datebase

The database is created with SQLite with `init.sql` as the schema for the quotes table, `db.js` runs the schema and opens the database into the `healthcoversim.db` file.

## Quote Calculation

The quote is calculated by the function `calculateQuote(quote)` which takes input from the database and returns the breakdown of it. With prices shown below

| Hospital | Price | Extras | Price | Cover type | Adults |
| --- | --- | --- | --- | --- | --- |
| None | $0 | None | $0 | Single | 1 |
| Basic | $90 | Basic | $25 | Couple | 2 |
| Bronze | $120 | Standard | $45 | Family | 2 + $30/month fee |
| Silver | $160 | Premium | $70 | | |
| Gold | $220 | | | | |  






| Cover history | Loading |
| --- | --- |
| Yes (held hospital cover before) | 0% |
| No | (age − 30) × 2% if age > 30, otherwise 0% |
| Not sure | 0%, plus a warning that the quote may be inaccurate |



## Family Cover Calculation

Family is priced similarly to Couple, with an addition of $30 a month.

## AI Usage

AI was used in helping creating the REAMDME file by initially help with a rough draft and grammars which I greatly alter significantly to align with my vision. Moreover, in the early stages of this project AI was used to clarify the requirements and example scenarios of how it would work accompanied with a small snipped of design code and calculation. However, those code and calculation are not present anymore in the final draft of this app as further research from the course material provided plentiful information needed to complete this project meeting all of its requirements.

## Limitation

This app is only created for desktop users and did not make any compatibility designs for mobile devices.