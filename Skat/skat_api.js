const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const axios = require('axios');
const HOSTNAME = 'localhost';
const PORT = 3001;
let app = express();
app.use(express.json());

let db = new sqlite3.Database('./db/skat.db', (err) => {
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
    FOREIGN KEY(SkatUserId) REFERENCES SkatUser(Id),
    FOREIGN KEY(SkatYearId) REFERENCES SkatYear(Id))`
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

// db.run(`CREATE TABLE IF NOT EXISTS SkatUser(
//     Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
//     UserId INTEGER NOT NULL,
//     CreatedAt DATE DEFAULT (datetime('now','localtime')),
//     IsActive INTEGER DEFAULT 1)`
// );

//
// // READ Accounts
// app.get("/account", (req, res) => {
//     let sql = `SELECT * FROM Account`;
//     db.all(sql, [], (err, accounts) => {
//         if (err) {
//             res.status(400).json({
//                 message: 'The Accounts could not be showed!',
//                 error: err
//             });
//             console.log(err);
//         }
//
//         res.status(200).json({
//             accounts
//         });
//     });
// });
//
// // READ Account by Id
// app.get("/account/:id", (req, res) => {
//     console.log("req.params.id: ", req.params.id);
//     let sql = `SELECT * FROM Account WHERE Id = ?`;
//
//     db.all(sql, [req.params.id], (err, account) => {
//         if (err) {
//             res.status(400).json({
//                 error: err
//             });
//             console.log(err);
//         }
//         if(account.length) {
//             res.status(200).json({
//                 account
//             });
//         } else {
//             res.status(404).json({
//                 message: `No Account was found with the id ${req.params.id}!`
//             });
//         }
//     });
// });
//
// // UPDATE Account by Id
// app.put("/account/:id", (req, res) => {
//     console.log("req.params.id: ", req.params.id);
//     let bankUserId = req.body.bankUserId;
//     let accountNo = req.body.accountNo;
//     let isStudent = req.body.isStudent;
//     let interestRate = req.body.interestRate;
//     let amount = req.body.amount;
//     let sqlGet = `SELECT * FROM Account WHERE Id = ?`;
//     let sqlUpdate = `UPDATE Account SET BankUserId = ?, AccountNo = ?, IsStudent = ?,
//                                         InterestRate = ?, Amount = ?, ModifiedAt = ?
//                                         WHERE Id = ?`;
//
//     db.all(sqlGet, [req.params.id], (err, account) => {
//         if (err) {
//             res.status(400).json({
//                 error: err
//             });
//             console.log(err);
//         }
//         console.log("Account: ", account);
//         if(!account.length) {
//             res.status(404).json({
//                 message: `No Account was found with the id ${req.params.id}!`
//             });
//         } else {
//             let date = new Date();
//             let year = date.getFullYear();
//             let month = ("0" + (date.getMonth() + 1)).slice(-2);
//             let day = ("0" + date.getDate()).slice(-2);
//             let hours = ("0" + date.getHours()).slice(-2);
//             let minutes = ("0" + date.getMinutes()).slice(-2);
//             let seconds = ("0" + date.getSeconds()).slice(-2);
//             let modifiedAt = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
//
//             db.run(sqlUpdate, [bankUserId, accountNo, isStudent, interestRate, amount, modifiedAt, req.params.id], (err) => {
//                 if (err) {
//                     if(err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: Account.AccountNo') {
//                         res.status(400).json({
//                             message: 'The Account Number already exists!',
//                             error: err.message
//                         });
//                     }
//                     res.status(400).json({
//                         message: 'The Account could not be updated!',
//                         error: err.message
//                     });
//                     console.log(err.message);
//                 }
//                 res.status(201).json({
//                     message: 'Account successfully updated!',
//                 });
//             });
//         }
//     });
// });
//
// // DELETE Account by Id
// app.delete("/account/:id", (req, res) => {
//     console.log("req.params.id: ", req.params.id);
//     let sqlGet = `SELECT * FROM Account WHERE Id = ?`;
//     let sqlDelete = `DELETE FROM Account WHERE Id = ?`;
//     db.all(sqlGet, [req.params.id], (err, account) => {
//         if (err) {
//             res.status(400).json({
//                 error: err
//             });
//             console.log(err);
//         }
//         console.log("Account: ", account);
//         if(!account.length) {
//             res.status(404).json({
//                 message: `No Account was found with the id ${req.params.id}!`
//             });
//         } else {
//             db.run(sqlDelete, req.params.id, (err) => {
//                 if (err) {
//                     res.status(400).json({
//                         message: 'The Account could not be deleted!',
//                         error: err.message
//                     });
//                     console.log(err.message);
//                 }
//                 res.status(200).json({
//                     message: 'Account successfully deleted!'
//                 });
//             });
//         }
//     });
// });

app.listen(PORT, HOSTNAME, (err) => {
    if(err){
        console.log(err);
    }
    else{
        console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
    }
});
