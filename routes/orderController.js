const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const _ = require("lodash");

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./test_test.db');

// Get Identity
async function formatIdentityInformation(req, res, next) {
    try {
        console.log("Identity")
        let customer = {
            email: req.body.email,
            phone: req.body.phoneNumber
        }
        await orderService.getIdentity(customer).then(contact => {
            console.log("All Record ", contact);
            res.json({
                contact
            })
        });

    } catch (err) {
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
}

// Create new order/Customer
router.post('/identity', async function (req, res, next) {
    try {
        let phone = req.body.phoneNumber;
        let email = req.body.email;
        if (_.isEmpty(phone) && _.isEmpty(email)) {
            // TODO update statas code
            return res.status(403).json({message: "Enter phone number or email to continue"});
        }
        let emailCustomer;
        let phoneCustomer;
        let customer;
        // find by All
        await orderService.getCustomer(phone, email).then(record => {
            customer = record;
        });
        // Customer found
        if (!_.isEmpty(customer)) {
            console.log("Customer found");
            return await formatIdentityInformation(req, res, next);
        }
        // find by email
        await orderService.getCustomerByEmail(email).then(record => {
            emailCustomer = record;
        });
        // find by phone
        await orderService.getCustomerByPhone(phone).then(record => {
            phoneCustomer = record;
        });
        // Create new primary account
        if (!_.isEmpty(emailCustomer) && !_.isEmpty(phoneCustomer)) {
            // create primary record
            let customer = {
                phone: phone,
                email: email,
                linkPrecedence: 'primary'
            };

            await orderService.createCustomer(customer).then(async customerId => {
                await orderService.updateAllSecondaryCustomer(customer, customerId);
                await orderService.getCustomerById(customerId).then(async data => {
                    // turn Primary record to secondary and assign this link
                    return await formatIdentityInformation(req, res, next);
                })
            });
        }
        // create new phone linked account
        else if (!_.isEmpty(phoneCustomer)) {

            let customer = {
                phone: phone,
                email: email,
                linkPrecedence: 'secondary',
                linkedId: phoneCustomer.id
            };
            await orderService.createSecondaryCustomer(customer).then(async customerId => {
                await orderService.getCustomerById(customerId).then(async data => {
                    return await formatIdentityInformation(req, res, next);
                })
            });

        }
        // create email linked account
        else if (!_.isEmpty(emailCustomer)) {
            let customer = {
                phone: phone,
                email: email,
                linkPrecedence: 'secondary',
                linkedId: emailCustomer.id
            };

            await orderService.createSecondaryCustomer(customer).then(async customerId => {
                await orderService.getCustomerById(customerId).then(async data => {
                    return await formatIdentityInformation(req, res, next);
                })
            });

        } else {
            // just create one!!!!
            let customer = {
                phone: phone,
                email: email,
                linkPrecedence: 'primary'
            }
            await orderService.createCustomer(customer).then(async customerId => {
                await orderService.getCustomerById(customerId).then(async data => {
                    return await formatIdentityInformation(req, res, next);
                })
            });
        }
    } catch (err) {
        console.error(`Error while processing data`, err.message);
        next(err);
    }
});

module.exports = router;