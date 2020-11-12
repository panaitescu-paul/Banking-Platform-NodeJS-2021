const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const axios = require('axios');
const HOSTNAME = 'localhost';
const PORT = 3001;
let app = express();
app.use(express.json());

let db = new sqlite3.Database('./db/bank.db', (err) => {
    if(err) {
        return console.log(err.message);
    }
    console.log("Connected to database!")
});

// -------------------
// |  SQLITE Tables  |
// -------------------

db.run(`CREATE TABLE IF NOT EXISTS SkatUser(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    IsActive INTEGER DEFAULT 1)`
);

db.run(`CREATE TABLE IF NOT EXISTS SkatUserYear(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    SkatUserId INTEGER NOT NULL,
    SkatYearId INTEGER NOT NULL,
    UserId INTEGER NOT NULL,
    IsPaid INTEGER DEFAULT 0,
    Amount REAL NOT NULL
    FOREIGN KEY(SkatUserId) REFERENCES SkatUser(Id),
    FOREIGN KEY(SkatYearId) REFERENCES SkatYear(Id))`
);

db.run(`CREATE TABLE IF NOT EXISTS SkatYear(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    Label TEXT NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    ModifiedAt DATE DEFAULT (datetime('now','localtime')),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL)`
);

app.listen(PORT, HOSTNAME, (err) => {
    if(err){
        console.log(err);
    }
    else{
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
    }
});
