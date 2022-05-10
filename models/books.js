let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let BookSchema = new Schema({
    date: Date,
    bookid: String, 
    bookname: String, 
    writername: String,
    edition: String,
    bookdesc: String,
    issue: Number,
    bookimg: String
});

let Book = mongoose.model('books', BookSchema);

module.exports = { Book }