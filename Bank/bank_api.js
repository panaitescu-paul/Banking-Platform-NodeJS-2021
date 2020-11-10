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

db.run(`CREATE TABLE IF NOT EXISTS BankUser(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    ModifiedAt DATE DEFAULT (datetime('now','localtime')))`
);

db.run(`CREATE TABLE IF NOT EXISTS Account(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    BankUserId INTEGER NOT NULL,
    AccountNo TEXT UNIQUE NOT NULL,
    IsStudent INTEGER,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    ModifiedAt DATE DEFAULT (datetime('now','localtime')),
    InterestRate REAL NOT NULL,
    Amount REAL NOT NULL,
    FOREIGN KEY(BankUserId) REFERENCES BankUser(Id))`
);

db.run(`CREATE TABLE IF NOT EXISTS Deposit(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    BankUserId INTEGER NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    Amount REAL NOT NULL,
    FOREIGN KEY(BankUserId) REFERENCES BankUser(Id))`
);

db.run(`CREATE TABLE IF NOT EXISTS Loan(
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    BankUserId INTEGER NOT NULL,
    CreatedAt DATE DEFAULT (datetime('now','localtime')),
    ModifiedAt DATE DEFAULT (datetime('now','localtime')),
    Amount REAL NOT NULL,
    FOREIGN KEY(BankUserId) REFERENCES BankUser(Id))`
);

// -------------------
// |  Bank User API  |
// -------------------

app.post("/bank", (req, res) => {
    let bankUserId = req.body.userId;
    let sql = `INSERT INTO BankUser(UserId) VALUES(?)`;

    db.run(sql, [bankUserId], (err) => {
        if (err) {
            res.status(400).json({
                message: 'The bank user could not be created!',
                error: err.message
            });
            console.log(err.message);
        }
        console.log(`A new row has been inserted!`);
        res.status(201).json({
            message: 'Bank user successfully created!',
        });
    });
});

app.get("/bank", (req, res) => {
    let sql = `SELECT * FROM BankUser`;
    db.all(sql, [], (err, bankUsers) => {
        if (err) {
            res.status(400).json({
                message: 'The bank users could not be showed!',
                error: err
            });
            console.log(err);
        }

        res.status(200).json({
            bankUsers
        });
    });
});

app.get("/bank/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sql = `SELECT * FROM BankUser WHERE Id = ?`;

    db.all(sql, [req.params.id], (err, bankUser) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        if(bankUser.length) {
            res.status(200).json({
                bankUser
            });
        } else {
            res.status(404).json({
                message: `No bank user found with the id ${req.params.id}!`
            });
        }
    });
});

app.put("/bank/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let bankUserId = req.body.userId;
    let sqlGet = `SELECT * FROM BankUser WHERE Id = ?`;
    let sqlUpdate = `UPDATE BankUser SET UserId = ?, ModifiedAt = ? WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, bankUser) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Bank User: ", bankUser);
        if(!bankUser.length) {
            res.status(404).json({
                message: `No bank user found with the id ${req.params.id}!`
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
            db.run(sqlUpdate, [bankUserId, modifiedAt, req.params.id], (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The bank user could not be updated!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(201).json({
                    message: 'Bank user successfully updated!',
                });
            });
        }
    });
});

app.delete("/bank/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sqlGet = `SELECT * FROM BankUser WHERE Id = ?`;
    let sqlDelete = `DELETE FROM BankUser WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, bankUser) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Bank user: ", bankUser);
        if(!bankUser.length) {
            res.status(404).json({
                message: `No bank user found with the id ${req.params.id}!`
            });
        } else {
            db.run(sqlDelete, req.params.id, (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The bank user could not be deleted!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(201).json({
                    message: 'Bank user successfully deleted!'
                });
            });
        }
    });
});

// -------------------
// |   Account API   |
// -------------------

// CREATE Account
app.post("/account", (req, res) => {
    let bankUserId = req.body.bankUserId;
    let accountNo = req.body.accountNo;
    let isStudent = req.body.isStudent;
    let interestRate = req.body.interestRate;
    let amount = req.body.amount;
    let sqlGetBankUser = `SELECT * FROM BankUser WHERE Id = ?`;
    let sqlAccount = `INSERT INTO Account(BankUserId, AccountNo, IsStudent, InterestRate, Amount) VALUES(?, ?, ?, ?, ?)`;

    // Check if the bankUserId exists in the BankUser table
    db.all(sqlGetBankUser, [bankUserId], (err, bankUser) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Bank user: ", bankUser);
        if(!bankUser.length) {
            res.status(404).json({
                message: `No Bank User found with the id ${bankUserId}!`
            });
        } else {
            db.run(sqlAccount, [bankUserId, accountNo, isStudent, interestRate, amount], (err) => {
                if (err) {
                    if(err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: Account.AccountNo') {
                        res.status(400).json({
                            message: 'The Account Number already exists!',
                            error: err.message
                        });
                    }
                    res.status(400).json({
                        message: 'The Account could not be created!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                console.log(`A new row has been inserted!`);
                res.status(201).json({
                    message: 'Account successfully created!',
                });
            });
        }
    });
});

// READ Accounts
app.get("/account", (req, res) => {
    let sql = `SELECT * FROM Account`;
    db.all(sql, [], (err, accounts) => {
        if (err) {
            res.status(400).json({
                message: 'The Accounts could not be showed!',
                error: err
            });
            console.log(err);
        }

        res.status(200).json({
            accounts
        });
    });
});

// READ Account by Id
app.get("/account/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sql = `SELECT * FROM Account WHERE Id = ?`;

    db.all(sql, [req.params.id], (err, account) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        if(account.length) {
            res.status(200).json({
                account
            });
        } else {
            res.status(404).json({
                message: `No Account was found with the id ${req.params.id}!`
            });
        }
    });
});

// UPDATE Account by Id
app.put("/account/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let bankUserId = req.body.bankUserId;
    let accountNo = req.body.accountNo;
    let isStudent = req.body.isStudent;
    let interestRate = req.body.interestRate;
    let amount = req.body.amount;

    let sqlGet = `SELECT * FROM Account WHERE Id = ?`;
    let sqlUpdate = `UPDATE Account SET BankUserId = ?, AccountNo = ?, IsStudent = ?, 
                                        InterestRate = ?, Amount = ?, ModifiedAt = ? 
                                        WHERE Id = ?`;

    db.all(sqlGet, [req.params.id], (err, account) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Account: ", account);
        if(!account.length) {
            res.status(404).json({
                message: `No Account was found with the id ${req.params.id}!`
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

            db.run(sqlUpdate, [bankUserId, accountNo, isStudent, interestRate, amount, modifiedAt, req.params.id], (err) => {
                if (err) {
                    if(err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: Account.AccountNo') {
                        res.status(400).json({
                            message: 'The Account Number already exists!',
                            error: err.message
                        });
                    }
                    res.status(400).json({
                        message: 'The Account could not be updated!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(201).json({
                    message: 'Account successfully updated!',
                });
            });
        }
    });
});

// DELETE Account by Id
app.delete("/account/:id", (req, res) => {
    console.log("req.params.id: ", req.params.id);
    let sqlGet = `SELECT * FROM Account WHERE Id = ?`;
    let sqlDelete = `DELETE FROM Account WHERE Id = ?`;
    db.all(sqlGet, [req.params.id], (err, account) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Account: ", account);
        if(!account.length) {
            res.status(404).json({
                message: `No Account was found with the id ${req.params.id}!`
            });
        } else {
            db.run(sqlDelete, req.params.id, (err) => {
                if (err) {
                    res.status(400).json({
                        message: 'The Account could not be deleted!',
                        error: err.message
                    });
                    console.log(err.message);
                }
                res.status(200).json({
                    message: 'Account successfully deleted!'
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
