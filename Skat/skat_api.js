const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const axios = require('axios');
const HOSTNAME = 'localhost';
const PORT = 3002;
let app = express();
app.use(express.json());

let db = new sqlite3.Database('../../Skat/db/skat.db', (err) => {
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

// CREATE Skat User
app.post("/skat-user", (req, res) => {
    let userId = req.body.userId;
    let sql = `INSERT INTO SkatUser(UserId) VALUES(?)`;

    db.run(sql, [userId], (err) => {
        if (err) {
            res.status(400).json({
                message: 'The Skat User could not be created!',
                error: err.message
            });
        } else {
            res.status(201).json({
                message: 'Skat User successfully created!',
            });
        }
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
        } else {
            res.status(200).json({
                users
            });
        }
    });
});

// READ Skat User by Id
app.get("/skat-user/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sql = `SELECT * FROM SkatUser WHERE Id = ?`;

    db.all(sql, [req.params.id], (err, users) => {
        if (err) {
            res.status(400).json({
                error: err
            });
        } else {
            if(users.length) {
                res.status(200).json({
                    users
                });
            } else {
                res.status(404).json({
                    message: `No Skat User was found with the userId ${req.params.id}!`
                });
            }
        }
    });
});

// UPDATE Skat User by Id
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
        } else {
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
                    } else {
                        res.status(201).json({
                            message: 'Skat user successfully updated!',
                        });
                    }
                });
            }
        }
    });
});

// DELETE Skat User by Id
app.delete("/skat-user/:id", (req, res) => {
    let sqlGet = `SELECT * FROM SkatUser WHERE Id = ?`;
    let sqlDelete = `DELETE FROM SkatUser WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, user) => {
        if (err) {
            res.status(400).json({
                error: err
            });
        } else {
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
                    } else {
                        res.status(200).json({
                            message: 'Skat User successfully deleted!'
                        });
                    }
                });
            }
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
        } else {
            skatYearId = this.lastID; // get the id of the record
            db.all(sqlGet, [], (err, users) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Skat Users could not be showed!',
                        error: err
                    });
                } else {
                    for (let i = 0; i < users.length; i++) {
                        // Add record in the Skat User Year Table for each Skat User
                        db.run(sqlSkatUserYear, [users[i].Id, skatYearId, users[i].UserId, 100], (err) => {
                            if (err) {
                                res.status(400).json({
                                    message: 'The Skat User Year could not be created!',
                                    error: err.message
                                });
                            }
                            console.log(`A new Skat User Year has been inserted!`);
                        });
                    }
                }
            });
            res.status(200).json({
                message: 'Skat Year successfully created!'
            });
        }
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
        } else {
            res.status(200).json({
                records
            });
        }
    });
});

// READ Skat Year by Id
app.get("/skat-year/:id", (req, res) => {
    let sql = `SELECT * FROM SkatYear WHERE Id = ?`;

    db.all(sql, [req.params.id], (err, years) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        } else {
            if(years.length) {
                res.status(200).json({
                    years
                });
            } else {
                res.status(404).json({
                    message: `No Skat Year was found with the Id ${req.params.id}!`
                });
            }
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
        } else {
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
                    } else {
                        res.status(201).json({
                            message: 'Skat Year successfully updated!',
                        });
                    }
                });
            }
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
        } else {
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
                    } else {
                        res.status(200).json({
                            message: 'Skat Year successfully deleted!'
                        });
                    }
                });
            }
        }
    });
});

// ---------------------------
// |   Other functionality   |
// ---------------------------

// Pay Taxes
app.post("/pay-taxes", (req, res) => {
    let userId = req.body.userId;
    let totalAmount = req.body.totalAmount;
    let sqlGet = `SELECT * FROM SkatUserYear WHERE UserId = ?`;
    let sqlGetSkatYear = `SELECT * FROM SkatYear WHERE Id = ?`;
    let sqlUpdate = `UPDATE SkatUserYear SET IsPaid = ?, Amount = ? WHERE Id = ?`;

    // Go through all the Bank Users
    axios.get(`http://localhost:3001/bank`).then(response => {
        let bankUsers = response.data.bankUsers;
        let isFound = false;
        for (let i = 0; i < bankUsers.length; i++) {
            if (bankUsers[i].UserId === userId) {
                isFound = true;
            }
        }
        if (!isFound) {
            res.status(404).json({
                message: `No User was found with the id ${userId}!`
            });
        } else {
            // Get all the Skat User Years based on UserId
            db.all(sqlGet, [userId], (err, skatUserYears) => {
                if (err) {
                    res.status(400).json({
                        error: err
                    });
                    console.log(err);
                } else {
                    if(skatUserYears.length) {
                        let unpaidTaxes = false;
                        for (let i = 0; i < skatUserYears.length; i++) {
                            // Check if the Taxes are paid
                            if (skatUserYears[i].IsPaid === 0 && skatUserYears[i].Amount > 0) {

                                // Get all the Skat Years based on Id
                                db.all(sqlGetSkatYear, [skatUserYears[i].SkatYearId], (err, skatYear) => {
                                    if (err) {
                                        res.status(400).json({
                                            error: err
                                        });
                                        console.log(err);
                                    } else {
                                        let date = new Date();
                                        let year = date.getFullYear();
                                        // Check if this is the current year
                                        if (skatYear[0].StartDate.substring(0, 4) <= year && year <= skatYear[0].EndDate.substring(0, 4)) {

                                            // Call Skat_Tax_Calculator Function
                                            axios.post(`http://localhost:7072/api/Skat_Tax_Calculator`, {
                                                "money": totalAmount,
                                            }).then((response) => {
                                                let taxAmount = response.data.tax_money;
                                                axios.post(`http://localhost:3001/withdraw-money`, {
                                                    "amount": taxAmount,
                                                    "userId": userId
                                                }).then((response) => {

                                                    // Update SkatUserYear by Id with the amount given by the Tax Calculator,
                                                    // and the boolean IsPaid is set to true
                                                    db.run(sqlUpdate, [1, taxAmount, skatUserYears[i].Id], (err) => {
                                                        if (err) {
                                                            res.status(400).json({
                                                                message: 'The Skat User Year could not be updated!',
                                                                error: err.message
                                                            });
                                                        } else {
                                                            res.status(200).json({
                                                                message: 'Taxes successfully paid!'
                                                            });
                                                        }
                                                    });
                                                }, (error) => {
                                                    if (error.response.status === 404) {
                                                        res.status(404).json({
                                                            message: error.response.data.message
                                                        });
                                                    }
                                                });
                                            }, (error) => {
                                                res.status(403).json({
                                                    message: error
                                                });
                                            });
                                        }
                                    }
                                });
                            } else {
                                unpaidTaxes = true;
                            }
                        }
                        if (unpaidTaxes) {
                            res.status(400).json({
                                message: 'The Taxes for this year are already paid!'
                            });
                        }
                    } else {
                        res.status(404).json({
                            message: `No Skat User Years was found for the user with id ${userId}!`
                        });
                    }
                }
            });
        }
    }).catch(err =>{
        if(err){
            res.status(400).json({
                message: err
            });
            console.log(err);
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
