let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let IssueSchema = new Schema({
    OriginalReturn: Date,
    bookid: String,
    bookname: String,
    studentid: String,
    studentname: String,
    IssueDate: String,
    ReturnDate: String,
    fine: Number
});

let Issue = mongoose.model('IssueDetails', IssueSchema);

module.exports = { Issue }