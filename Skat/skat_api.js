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
