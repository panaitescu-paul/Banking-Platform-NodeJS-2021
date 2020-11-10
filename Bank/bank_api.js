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
                    } else {
                        res.status(400).json({
                            message: 'The Account could not be created!',
                            error: err.message
                        });
                        console.log(err.message);
                    }
                } else {
                    console.log(`A new row has been inserted!`);
                    res.status(201).json({
                        message: 'Account successfully created!',
                    });
                }

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

// Add deposit
app.post("/add-deposit", (req, res) => {
    let amount = req.body.amount;
    let bankUserId = req.body.bankUserId;
    let sqlGetBankUser = `SELECT * FROM BankUser WHERE Id = ?`;
    let sqlAddDeposit = `INSERT INTO Deposit(BankUserId, Amount) VALUES(?, ?)`;
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
            if (amount <= 0 || amount === null) {
                res.status(404).json({
                    message: 'The amount deposited cannot be null or negative!',
                });
            } else {
                axios.post('http://localhost:7071/api/Bank_Interest_Rate', {depositAmount: amount}).then(response =>{
                    let result = response.data;
                    db.run(sqlAddDeposit, [bankUserId, result], (err) => {
                        if (err) {
                            res.status(400).json({
                                message: 'The Deposit could not be created!',
                                error: err.message
                            });
                            console.log(err.message);
                        }
                        console.log(`A new row has been inserted!`);
                        res.status(201).json({
                            message: 'Deposit successfully created!',
                        });
                    });
                }).catch(err =>{
                    if(err){
                        console.log(err);
                        res.status(403).json({
                            message: err
                        });
                    }
                });
            }

        }
    });
});

// List deposits
app.get("/list-deposits/:bankUserId", (req, res) => {
    console.log("req.params.bankUserId: ", req.params.bankUserId);
    let sql = `SELECT * FROM Deposit WHERE BankUserId = ?`;

    db.all(sql, [req.params.bankUserId], (err, deposits) => {
        if (err) {
            res.status(400).json({
                error: err
            });
            console.log(err);
        }
        console.log("Deposits", deposits);
        if(deposits.length) {
            res.status(200).json({
                deposits
            });
        } else {
            res.status(404).json({
                message: `No deposits found for the bank user with the id ${req.params.bankUserId}!`
            });
        }
    });
});

// Withdraw money
app.post("/withdraw-money", (req, res) => {
    let amount = req.body.amount;
    let userId = req.body.userId;
    let sqlGetBankUser = `SELECT * FROM BankUser WHERE UserId = ?`;
    let sqlGetAccount = `SELECT * FROM Account WHERE BankUserId = ?`;
    let sqlUpdateAccount = `UPDATE Account SET Amount = ?, ModifiedAt = ? WHERE Id = ?`;

    if (amount <= 0 || amount === null) {
        res.status(404).json({
            message: 'The amount deposited cannot be null or negative!',
        });
    } else {
        db.all(sqlGetBankUser, [userId], (err, bankUser) => {
            if (err) {
                res.status(400).json({
                    error: err
                });
                console.log(err);
            }
            console.log("bankUser", bankUser[0]);
            if(bankUser.length) {
                db.all(sqlGetAccount, [bankUser[0].Id], (err, accounts) => {
                    if (err) {
                        res.status(400).json({
                            error: err
                        });
                        console.log(err);
                    }
                    console.log("accounts", accounts);
                    if(accounts.length) {
                        let withdraw = false;
                        let id = "";
                        let amountBeforeWithdraw = "";
                        for (let i = 0; i < accounts.length; i++) {
                            if (accounts[i].Amount - amount >= 0) {
                                withdraw = true;
                                id = accounts[i].Id;
                                amountBeforeWithdraw = accounts[i].Amount;
                                break;
                            }
                        }
                        console.log(withdraw);
                        console.log(id);
                        console.log(amountBeforeWithdraw);
                        if (withdraw) {
                            let date = new Date();
                            let year = date.getFullYear();
                            let month = ("0" + (date.getMonth() + 1)).slice(-2);
                            let day = ("0" + date.getDate()).slice(-2);
                            let hours = ("0" + date.getHours()).slice(-2);
                            let minutes = ("0" + date.getMinutes()).slice(-2);
                            let seconds = ("0" + date.getSeconds()).slice(-2);
                            let modifiedAt = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
                            let amountAfterWithdraw = amountBeforeWithdraw - amount;
                            db.run(sqlUpdateAccount, [amountAfterWithdraw, modifiedAt, id], (err) => {
                                if (err) {
                                    res.status(400).json({
                                        message: 'The Account could not be updated!',
                                        error: err.message
                                    });
                                    console.log(err.message);
                                } else {
                                    res.status(201).json({
                                        message: 'Withdraw successfully completed!',
                                    });
                                }
                            });
                        } else {
                            res.status(404).json({
                                message: 'You do not have enough money in any of your accounts!',
                            });
                        }
                    } else {
                        res.status(404).json({
                            message: `No accounts found for the bank user with the id ${bankUser.Id}!`
                        });
                    }
                });
            } else {
                res.status(404).json({
                    message: `No bank user found for the user with the id ${userId}!`
                });
            }
        });
    }
});


// ---------------------------
// |   Other functionality   |
// ---------------------------


// Create Loan
app.post("/create-loan", (req, res) => {
    let bankUserId = req.body.bankUserId;
    let loanAmount = req.body.loanAmount;
    let totalAccountAmount = 0;

    let sqlGetBankUser = `SELECT * FROM BankUser WHERE Id = ?`;
    let sqlLoan = `INSERT INTO Loan(BankUserId, Amount) VALUES(?, ?)`;

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
            // Get the sum of all accounts from a certain User
            axios.get(`http://localhost:3001/account`).then(response => {
                let accounts = response.data.accounts;
                console.log('accounts', accounts);

                for (i = 0; i < accounts.length; i++) {
                    if (bankUserId === accounts[i].BankUserId) {
                        totalAccountAmount += accounts[i].Amount;
                        console.log('totalAccountAmount ++ ', totalAccountAmount);
                    }
                }
                console.log('totalAccountAmount', totalAccountAmount);

                // Check if the Loan is Valid
                axios.post(`http://localhost:7071/api/Loan_Algorithm`, {
                    "loan": loanAmount,
                    "totalAccountAmount": totalAccountAmount
                }).then((response) => {
                    console.log(response);
                    db.run(sqlLoan, [bankUserId, loanAmount], (err) => {
                        if (err) {
                            res.status(400).json({
                                message: 'The Loan could not be created!',
                                error: err.message
                            });
                            console.log(err.message);
                        }
                        console.log(`A new row has been inserted!`);
                        res.status(201).json({
                            message: 'Loan successfully created!',
                        });
                    });

                }, (error) => {
                    console.log(error);
                    res.status(403).json({
                        message: 'The Loan could not be created! Loan amount is too big!',
                    });
                });
            }).catch(err =>{
                if(err){
                    res.status(400).json({
                        message: 'Could not get the total Account Amount for this User Id!'
                    });
                    console.log(err);
                }
            });
        }
    });
});

// UPDATE Loan and Account
app.put("/pay-loan", (req, res) => {
    let bankUserId = req.body.bankUserId;
    let loanId = req.body.loanId;
    let accountAmount;
    let loanAmount;
    let sqlGetLoan = `SELECT * FROM Loan WHERE Id = ?`;
    let sqlGetAccount = `SELECT * FROM Account WHERE BankUserId = ?`;
    let sqlUpdateLoan = `UPDATE Loan SET Amount = ?, ModifiedAt = ? WHERE Id = ?`;
    let sqlUpdateAccount = `UPDATE Account SET Amount = ?, ModifiedAt = ? WHERE Id = ?`;

    db.all(sqlGetAccount, [bankUserId], (err, account) => {
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

            // Get the Loan Amount
            db.all(sqlGetLoan, [loanId], (err, loan) => {
                if (err) {
                    res.status(400).json({
                        error: err
                    });
                    console.log(err);
                }
                if(!loan.length) {
                    res.status(404).json({
                        message: `No Loan was found with the id ${loanId}!`
                    });
                } else {
                    loanAmount = loan[0].Amount;
                    console.log('loanAmount', loanAmount);

                    // Get the Account Amount
                    db.all(sqlGetAccount, [bankUserId], (err, account) => {
                        if (err) {
                            res.status(400).json({
                                error: err
                            });
                            console.log(err);
                        }
                        if(!account.length) {
                            res.status(404).json({
                                message: `No Account was found with the id ${bankUserId}!`
                            });
                        } else {
                            console.log('account[0].Id', account[0].Id);

                            accountAmount = account[0].Amount;
                            console.log('accountAmount', accountAmount);

                            // Obtain new Account Amount after loan substraction
                            let amount = accountAmount - loanAmount;
                            console.log('accountAmount', accountAmount);
                            console.log('loanAmount', loanAmount);
                            console.log('amount', amount);

                            if (loanAmount > accountAmount) {
                                res.status(400).json({
                                    message: 'Not enough money in the Account to pay the Loan!',
                                });
                            } else {
                                // Substract Amount from Account
                                db.run(sqlUpdateAccount, [amount, modifiedAt, account[0].Id], (err) => {
                                    if (err) {
                                        res.status(400).json({
                                            message: 'The Account could not be updated!',
                                            error: err.message
                                        });
                                    }

                                    db.run(sqlUpdateLoan, [0, modifiedAt, loanId], (err) => {
                                        if (err) {
                                            res.status(400).json({
                                                message: 'The Loan could not be updated!',
                                                error: err.message
                                            });
                                        }
                                        res.status(201).json({
                                            message: 'Loan and Account successfully updated!',
                                        });
                                    });
                                });
                            }
                        }
                    });
                }
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
