const express = require("express");
const app = express();
const port = 8080;
var _ = require('lodash');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./test.db');


const orderControllerRoute = require("./routes/orderController");
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.get("/test", (req, res) => {
    res.json({ message: "we are ✈️✈️" });
});



app.use("/", orderControllerRoute);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({ message: err.message });
    return;
});

app.listen(port, () => {
    console.log(`Bitespeed task listening at http://localhost:${port}`);

    db.serialize(() => {

        db.run(`
            CREATE TABLE IF NOT EXISTS customer (
                'id' int(11) NOT NULL,
                'phoneNumber' varchar(15) DEFAULT NULL,
                'email' varchar(255) DEFAULT NULL,
                'linkedId' int DEFAULT NULL,
                'linkPrecedence' varchar(12) NOT NULL,
                'createdAt' datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                'updatedAt' datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                'deletedAt' datetime DEFAULT NULL)
            `);

        db.all("SELECT * FROM customer WHERE id=1", (err, row) => {
            if (_.isEmpty(row)) {
                // Uncomment this for Pre declared Values
                // db.run(`INSERT INTO customer('id','email','linkPrecedence') VALUES (1,'abc@edu.com', 'primary')`)
                // db.run(`-- INSERT INTO customer('id','email','linkPrecedence') VALUES (2,'xyz@edu.com', 'primary')`)
                process.env.count = "0";
                console.log("Env count", process.env.count);
            }
        });
        db.each("SELECT COUNT(*) as count FROM customer", (err, row) => {
            process.env.count = row.count;
        });
    });
});