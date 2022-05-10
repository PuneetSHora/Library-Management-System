let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let InfoSchema = new Schema({
    date: Date,
    first: String,
    last: String,
    email: String,
    enroll: String,
    phone: String,
    password: String,
    flag: Number
});

let Info = mongoose.model('Register', InfoSchema);

module.exports = { Info }