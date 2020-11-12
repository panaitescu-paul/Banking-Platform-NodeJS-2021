const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const axios = require('axios');
const HOSTNAME = 'localhost';
const PORT = 3002;
let app = express();
app.use(express.json());

let db = new sqlite3.Database('./db/skat.db', (err) => {
    if(err) {
        return console.log(err.message);
    }
    console.log("Connected to database!")
});

// For Referential Integrity
db.get("PRAGMA foreign_keys = ON");

// -------------------
// |  SQLITE Tables  |
// -------------------

db.run(`CREATE TABLE IF NOT EXISTS SkatUser(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    IsActive INTEGER DEFAULT 1)`
);

db.run(`CREATE TABLE IF NOT EXISTS SkatYear(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    Label TEXT NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    ModifiedAt DATE DEFAULT (datetime('now','localtime')),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL)`
);

db.run(`CREATE TABLE IF NOT EXISTS SkatUserYear(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    SkatUserId INTEGER NOT NULL,
    SkatYearId INTEGER NOT NULL,
    UserId INTEGER NOT NULL,
    IsPaid INTEGER DEFAULT 0,
    Amount REAL NOT NULL,
    FOREIGN KEY(SkatUserId) REFERENCES SkatUser(Id) ON DELETE CASCADE,
    FOREIGN KEY(SkatYearId) REFERENCES SkatYear(Id) ON DELETE CASCADE)`
);

// -------------------
// |   Skat User API   |
// -------------------

// CREATE SkatUser
app.post("/skat-user", (req, res) => {
    let userId = req.body.userId;
    let sql = `INSERT INTO SkatUser(UserId) VALUES(?)`;

    db.run(sql, [userId], (err) => {
        if (err) {
            res.status(400).json({
                message: 'The Skat User could not be created!',
                error: err.message
            });
            console.log(err.message);
        }
        console.log(`A new row has been inserted!`);
        res.status(201).json({
            message: 'Skat User successfully created!',
        });
    });
});

// READ ALL Skat Users
app.get("/skat-user", (req, res) => {
    let sql = `SELECT * FROM SkatUser`;
    db.all(sql, [], (err, users) => {
        if (err) {
            res.status(400).json({
                message: 'The Skat Users could not be showed!',
                error: err
            });
            console.log(err);
        }

        res.status(200).json({
            users
        });
    });
});

// READ Skat User by userId
app.get("/skat-user/:userId", (req, res) => {
    console.log("req.params.userId: ", req.params.userId);
    let sql = `SELECT * FROM SkatUser WHERE UserId = ?`;

    db.all(sql, [req.params.userId], (err, users) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        if(users.length) {
            res.status(200).json({
                users
            });
        } else {
            res.status(404).json({
                message: `No Skat User was found with the userId ${req.params.userId}!`
            });
        }
    });
});

// UPDATE Account by Id
app.put("/skat-user/:id", (req, res) => {
    let userId = req.body.userId;
    let isActive = req.body.isActive;
    let sqlGet = `SELECT * FROM SkatUser WHERE Id = ?`;
    let sqlUpdate = `UPDATE SkatUser SET UserId = ?, IsActive = ? WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, skatUser) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Skat User: ", skatUser);
        if(!skatUser.length) {
            res.status(404).json({
                message: `No Skat User found with the id ${req.params.id}!`
            });
        } else {
            db.run(sqlUpdate, [userId, isActive, req.params.id], (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Skat User could not be updated!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(201).json({
                    message: 'Skat user successfully updated!',
                });
            });
        }
    });
});

// DELETE Skat User by Id
app.delete("/skat-user/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sqlGet = `SELECT * FROM SkatUser WHERE Id = ?`;
    let sqlDelete = `DELETE FROM SkatUser WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, user) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("User: ", user);
        if(!user.length) {
            res.status(404).json({
                message: `No Skat User was found with the id ${req.params.id}!`
            });
        } else {
            db.run(sqlDelete, req.params.id, (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Skat User could not be deleted!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(200).json({
                    message: 'Skat User successfully deleted!'
                });
            });
        }
    });
});

// -------------------
// |   Skat Year API   |
// -------------------

// CREATE Skat Year
app.post("/skat-year", (req, res) => {
    let label = req.body.label;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let skatYearId;
    let sqlSkatYear = `INSERT INTO SkatYear(Label, StartDate, EndDate) VALUES(?, ? , ?)`;
    let sqlGet = `SELECT * FROM SkatUser`;
    let sqlSkatUserYear = `INSERT INTO SkatUserYear(SkatUserId, SkatYearId, UserId, Amount) VALUES(?, ? , ?, ?)`;

    db.run(sqlSkatYear, [label, startDate, endDate], function(err) {
        if (err) {
            res.status(400).json({
                message: 'The Skat Year could not be created!',
                error: err.message
            });
            console.log(err.message);
        }
        console.log(`A new row has been inserted!`);
        skatYearId = this.lastID; // get the id of the record
        console.warn("inserted id:", this.lastID);
        db.all(sqlGet, [], (err, users) => {
            if (err) {
                res.status(400).json({
                    message: 'The Skat Users could not be showed!',
                    error: err
                });
                console.log(err);
            }
            for (i = 0; i < users.length; i++) {
                // Add record in the Skat User Year Table for each Skat User
                console.log("users[i].Id" + users[i].Id);
                db.run(sqlSkatUserYear, [users[i].Id, skatYearId, users[i].UserId, 0], (err) => {
                    if (err) {
                        res.status(400).json({
                            message: 'The Skat User Year could not be created!',
                            error: err.message
                        });
                        console.log(err.message);
                    }
                    console.log(`A new Skat User Year has been inserted!`);
                });
            }
        });
        res.status(200).json({
            message: 'Skat Year successfully created!'
        });
    });
});

// READ ALL Skat Years
app.get("/skat-year", (req, res) => {
    let sql = `SELECT * FROM SkatYear`;
    db.all(sql, [], (err, records) => {
        if (err) {
            res.status(400).json({
                message: 'The Skat Years could not be showed!',
                error: err
            });
            console.log(err);
        }

        res.status(200).json({
            records
        });
    });
});

// READ Skat Year by Id
app.get("/skat-year/:id", (req, res) => {
    console.log("req.params.userId: ", req.params.id);
    let sql = `SELECT * FROM SkatYear WHERE Id = ?`;

    db.all(sql, [req.params.id], (err, years) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        if(years.length) {
            res.status(200).json({
                years
            });
        } else {
            res.status(404).json({
                message: `No Skat Year was found with the Id ${req.params.id}!`
            });
        }
    });
});

// UPDATE Skat Year by Id
app.put("/skat-year/:id", (req, res) => {
    let label = req.body.label;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let sqlGet = `SELECT * FROM SkatYear WHERE Id = ?`;
    let sqlUpdate = `UPDATE SkatYear SET Label = ?, ModifiedAt = ?, StartDate = ?, EndDate = ? WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, skatYear) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Skat Year: ", skatYear);
        if(!skatYear.length) {
            res.status(404).json({
                message: `No Skat Year found with the id ${req.params.id}!`
            });
        } else {
            let date = new Date();
            let year = date.getFullYear();
            let month = ("0" + (date.getMonth() + 1)).slice(-2);
            let day = ("0" + date.getDate()).slice(-2);
            let hours = ("0" + date.getHours()).slice(-2);
            let minutes = ("0" + date.getMinutes()).slice(-2);
            let seconds = ("0" + date.getSeconds()).slice(-2);
            let modifiedAt = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
            db.run(sqlUpdate, [label, modifiedAt, startDate, endDate, req.params.id], (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Skat Year could not be updated!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(201).json({
                    message: 'Skat Year successfully updated!',
                });
            });
        }
    });
});

// DELETE Skat Year by Id
app.delete("/skat-year/:id", (req, res) => {
    let sqlGet = `SELECT * FROM SkatYear WHERE Id = ?`;
    let sqlDelete = `DELETE FROM SkatYear WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, year) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("User: ", year);
        if(!year.length) {
            res.status(404).json({
                message: `No Skat Year was found with the id ${req.params.id}!`
            });
        } else {
            db.run(sqlDelete, req.params.id, (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Skat Year could not be deleted!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(200).json({
                    message: 'Skat Year successfully deleted!'
                });
            });
        }
    });
});

app.listen(PORT, HOSTNAME, (err) => {
    if(err){
        console.log(err);
    }
    else{
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
    }
});
