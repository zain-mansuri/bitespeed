const _ = require("lodash");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./test_test.db');

/**
 * Get Customer By Id
 * @param id
 * @returns {Promise<unknown>}
 */
async function getCustomerById(id) {
    console.log("Get By Id", id);
    return new Promise((resolve, reject) => {
        return db.get(`SELECT *
                       FROM customer
                       WHERE id = ${id}`, (err, row) => {
            if (_.isEmpty(row)) {
                resolve(null);
            } else {
                resolve(row);
            }
        });
    })
}

/**
 * Create New customer
 * @param customer
 * @returns {Promise<unknown>}
 */
async function createCustomer(customer) {
    process.env.count = parseInt(process.env.count) + 1;
    return new Promise((resolve, reject) => {
        return db.run(`INSERT INTO customer('id', 'email', 'phoneNumber', 'linkPrecedence')
                       VALUES (${process.env.count}, '${customer.email}', '${customer.phone}',
                               '${customer.linkPrecedence}')`, [], function (error) {
            if (error) {
                console.error(error.message);
                reject(error.message);
            }
            console.log(`Inserted a row with the ID: ${this.lastID}`);
            return resolve(this.lastID);
        })
    })
}

/**
 * Create New Secondary customer
 * @param customer
 * @returns {Promise<unknown>}
 */
async function createSecondaryCustomer(customer) {
    process.env.count = parseInt(process.env.count) + 1;
    return new Promise((resolve, reject) => {
        return db.run(`INSERT INTO customer('id', 'email', 'phoneNumber', 'linkPrecedence', 'linkedId')
                       VALUES (${process.env.count}, '${customer.email}', '${customer.phone}',
                               '${customer.linkPrecedence}', ${customer.linkedId})`, [], function (error) {
            if (error) {
                console.error(error.message);
                reject(error.message);
            }
            console.log(`Secondary Inserted a row with the ID: ${this.lastID}`);
            return resolve(this.lastID);
        })
    })
}

// Get Customer By Email
async function getCustomerByEmail(email, type) {
    return await getCustomerByColumnName("email", email).then(data => {
        if (!_.isEmpty(type))
            return data;
        else
            return _.isEmpty(data) ? null : data[0];
    }).catch(err => {
        console.log("ERR", err.message);
    })
}

// Get Customer By Phone
async function getCustomerByPhone(phone, type) {
    return await getCustomerByColumnName("phoneNumber", phone).then(data => {
        if (!_.isEmpty(type))
            return data;
        else
            return _.isEmpty(data) ? null : data[0];
    }).catch(err => {
        console.log("ERR", err.message);
    })
}

/**
 * Get Customer By Phone + Email
 * @param phone
 * @param email
 * @returns {Promise<unknown>}
 */
async function getCustomer(phone, email) {
    return await getCustomerByEmailPhone(phone, email).then(data => {
        return data;
    }).catch(err => {
        console.log("ERR", err.message);
    })
}

/**
 * Generic Function
 * Get By Column name and value
 * @param columnName
 * @param value
 * @param linkPrecedence
 * @returns {Promise<unknown>}
 */
async function getCustomerByColumnName(columnName, value, linkPrecedence) {
    return new Promise((resolve, reject) => {
        let buildQuery = `SELECT *
                          from customer
                          where ${columnName} = '${value}'`;
        buildQuery = _.isEmpty(linkPrecedence) ? buildQuery : buildQuery + ` AND linkPrecedence = '${linkPrecedence}'`;
        console.log(buildQuery);
        return db.all(buildQuery, (err, row) => {
            if (_.isEmpty(row)) {
                resolve(null)
            } else {
                resolve(row);
            }
        });
    })
}

async function getCustomerByEmailPhone(phone, email) {
    return new Promise((resolve, reject) => {
        return db.all(`SELECT *
                       from customer
                       where phoneNumber = '${phone}'
                         AND email = '${email}'`, (err, row) => {
            if (_.isEmpty(row)) {
                resolve(null);
            } else {
                resolve(row[0]);
            }
        });
    })
}

/**
 * Update Customer data
 * @param customer
 * @returns {Promise<unknown>}
 */
async function updateCustomerRecord(customer) {
    return new Promise((resolve, reject) => {

        return db.run(`UPDATE customer
                       SET email="${customer.email}",
                           phoneNumber="${customer.phoneNumber}",
                           linkPrecedence="${customer.linkPrecedence}",
                           linkedId=${customer.linkedId}
                       WHERE id = ${customer.id}`, [], function (error) {
            if (error) {
                console.error(error.message);
                reject(error.message);
            }
            resolve('updated');
        })
    })
}

// Update Customer
async function updateAllSecondaryCustomer(customer, linkId) {
    // get All by email
    console.log("Update aa 2nd ", linkId);
    await getCustomerByEmail(customer.email, "All").then(arr => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].id !== linkId) {
                getCustomerByColumnName("linkedId", arr[i].id).then(records => {
                    for (let i = 0; i < records.length; i++) {
                        records[i].linkPrecedence = "secondary";
                        records[i].linkedId = linkId
                        updateCustomerRecord(records[i]);
                    }
                })
                arr[i].linkPrecedence = "secondary";
                arr[i].linkedId = linkId
                updateCustomerRecord(arr[i]);
            }
        }
    });
    // get all by phone
    console.log("Update phone")
    await getCustomerByPhone(customer.phone, "All").then(arr => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].id !== linkId) {
                getCustomerByColumnName("linkedId", arr[i].id).then(records => {
                    for (let i = 0; i < records.length; i++) {
                        records[i].linkPrecedence = "secondary";
                        records[i].linkedId = linkId
                        updateCustomerRecord(records[i]);
                    }
                })
                arr[i].linkPrecedence = "secondary";
                arr[i].linkedId = linkId
                updateCustomerRecord(arr[i]);
            }
        }
    })
}

/**
 * Get Identity list
 * @param customer
 * @returns {Promise<{secondaryContactIds: any[], phoneArray: any[], primaryContatctId: any[], emailArray: any[]}>}
 */
async function getIdentity(customer) {
    let phoneArray = new Set();
    let emailArray = new Set();
    let secondaryIds = new Set();
    let primaryContractIds = new Set();
    if (!_.isEmpty(customer.phone)) {
        // try to get primary data
        await getCustomerByColumnName("phoneNumber", customer.phone, 'primary').then(async data => {
            if (_.isEmpty(data)) {
                phoneArray.add(customer.phone);
                // Humm.... primary data is Empty, Let's get secondary data And Also primary one.
                await getCustomerByColumnName("phoneNumber", customer.phone).then(async result => {
                    if (!_.isEmpty(result)) {
                        for (let i = 0; i < result.length; i++) {
                            await getCustomerByColumnName("linkedId", result[0].linkedId).then(arr => {
                                for (let i = 0; i < arr.length; i++) {
                                    phoneArray.add(arr[i].phoneNumber);
                                    emailArray.add(arr[i].email);
                                    primaryContractIds.add(arr[i].linkedId);
                                    secondaryIds.add(arr[i].id);
                                }
                            })
                        }

                        // This is primary data
                        await getCustomerById(result[0].linkedId).then(customer => {
                            phoneArray.add(customer.phoneNumber);
                            emailArray.add(customer.email);
                            primaryContractIds.add(customer.id);
                            secondaryIds.add(result[0].id);
                        })
                    }
                    // this number is not registered.
                })
            } else {
                phoneArray.add(customer.phone);
                emailArray.add(customer.email);
                await getCustomerByColumnName("linkedId", data[0].id).then(arr => {
                    for (let i = 0; i < arr.length; i++) {
                        phoneArray.add(arr[i].phoneNumber);
                        emailArray.add(arr[i].email);
                        primaryContractIds.add(arr[i].linkedId);
                        secondaryIds.add(arr[i].id);
                    }
                })
            }
        }).catch(err => {
            console.log("ERR", err.message);
        })
    }
    return {
        phoneArray: Array.from(phoneArray),
        emailArray: Array.from(emailArray),
        primaryContatctId: Array.from(primaryContractIds),
        secondaryContactIds: Array.from(secondaryIds)
    }
}

module.exports = {
    getCustomerByEmail,
    getCustomerByPhone,
    createCustomer,
    createSecondaryCustomer,
    getCustomer,
    updateAllSecondaryCustomer,
    getCustomerById,
    getIdentity
}