let express = require('express');
let router = express.Router();
let multer = require('multer');
let Book = require('../models/books').Book;

let { ensureAuthenticated } = require('../config/auth');

const bodyParser = require('body-parser');

router.use(bodyParser.json());

let storage = multer.diskStorage({
    destination: (req, file, callback)=>{
        callback(null, './public/img');
    },
    filename: (req, file, callback)=>{
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
})

let upload = multer({
    storage: storage,
}).single('image');

router.post('/addBooks', upload, async(req,res)=>{
    let issue = 0;
    let reqBody = req.body;
    let bookid = reqBody.bookid;
    let book = await Book.find().where({bookid: bookid});
    if(book.length == 0)
    {
        let newBook = new Book({
            date: new Date(),
            bookid: reqBody.bookid,
            bookname: reqBody.bookname,
            writername: reqBody.writername,
            edition: reqBody.edition,
            bookdesc: reqBody.bookdesc,
            issue: issue,
            bookimg: req.file.filename
        })
        //console.log(req.file);
       // res.redirect('/infos/admin');
        newBook.save()
            .then(user =>{
                req.flash('booksaved_msg', 'Book added successfully');
                res.redirect('/infos/admin');
            })
    }
    else{
        req.flash('booksaved_msg', 'Book was already added');
        res.redirect('/infos/admin');
    }
})

router.get('/admin/:bookid', ensureAuthenticated, async(req, res)=>{
    let id = req.params.bookid;
    let book = await Book.findOne({ bookid: id });
    res.render('bookinfo', {
        bookimg: book.bookimg,
        bookname: book.bookname,
        writername: book.writername,
        edition: book.edition,
        bookdesc: book.bookdesc
    })
})

router.post('/admin/:bookid', async(req, res)=>{
    let id = req.params.bookid;
    let book = await Book.findOneAndRemove({bookid: id});
    await book.remove();
    res.redirect('/infos/admin');
    
})

router.get('/edit/:bookid', ensureAuthenticated, async(req, res)=>{
    let id = req.params.bookid;
    let book = await Book.findOne({ bookid: id});
    res.render('edit', {
        bookid: id,
        bookname: book.bookname,
        writername: book.writername,
        edition: book.edition,
        bookdesc: book.bookdesc,
        bookimg: book.bookimg
    })
})

router.post('/edit/:bookid', upload, async(req, res)=>{
    let id = req.params.bookid;
    let new_image = "";
    if(req.file){
        new_image = req.file.filename;
    }
    else{
        new_image = req.body.old_image;
    }
    await Book.findOneAndUpdate({bookid: id},{
        $set: {
            bookname: req.body.bookname,
            writername: req.body.writername,
            edition: req.body.edition,
            bookdesc: req.body.bookdesc,
            bookimg: new_image
        },
    }).then(user =>{
        req.flash('update_msg', 'Book Updated successfully');
        res.redirect('/infos/admin');
    })
})

router.get('/booksearch', ensureAuthenticated, async(req, res)=>{
    let books = await Book.find();
    res.render('booksearch', {
        books: books,
        searched: ""
    });
})

router.post('/booksearch', async(req, res)=>{
    let search = req.body.searchtype;
    let bookbyid = await Book.find().where({bookid: search});
    let bookbyname = await Book.find().where({bookname: search});
    let bookbywriter = await Book.find().where({writername: search});
    let nobooks = [];

    if(bookbyid!=0 || bookbyname!=0 || bookbywriter!=0)
    {
        if(bookbyid!=0)
        {
            res.render('booksearch',{
                books: bookbyid,
                searched: search
            })
        }
        if(bookbyname!=0)
        {
            res.render('booksearch',{
                books: bookbyname,
                searched: search
            })
        }
        if(bookbywriter!=0)
        {
            res.render('booksearch',{
                books: bookbywriter,
                searched: search
            })
        }
    }
    else{
        nobooks.push({msg: 'No Such Book Available'});
        res.render('booksearch',{
            nobooks,
            books: bookbyid,
            searched: search
        })
    }

})

router.post('/stubooksearch', async(req, res)=>{
    let search = req.body.searchtype;
    let bookbyid = await Book.find().where({bookid: search});
    let bookbyname = await Book.find().where({bookname: search});
    let bookbywriter = await Book.find().where({writername: search});
    let nobooks = [];

    if(bookbyid!=0 || bookbyname!=0 || bookbywriter!=0)
    {
        if(bookbyid!=0)
        {
            res.render('stubooksearch',{
                books: bookbyid,
                searched: search
            })
        }
        if(bookbyname!=0)
        {
            res.render('stubooksearch',{
                books: bookbyname,
                searched: search
            })
        }
        if(bookbywriter!=0)
        {
            res.render('stubooksearch',{
                books: bookbywriter,
                searched: search
            })
        }
    }
    else{
        nobooks.push({msg: 'No Such Book Available'});
        res.render('stubooksearch',{
            nobooks,
            books: bookbyid,
            searched: search
        })
    }

})

// router.get('/bookshow', async(req, res)=>{
//     Book.find().exec((err, books)=>{
//         let bookmsgs = [];
//         let index = 1;
//         if(books.length == 0){
//             bookmsgs.push({msg: 'No Books Available'});
//             res.render('bookshow',{
//                 bookmsgs,
//                 books: books
//             })
//         }
//         else{
//             res.render('bookshow',{
//                 index: index,
//                 books: books
//             })
//         }
//     })
// })

// router.post('/booksname', (req, res)=>{
//     let hint = "";
//     let response = "";
//     let searchQ = req.body.query.toLowerCase();
//     console.log(searchQ);
//     if(searchQ.length > 0){
//         Book.find(function(err, results){
//             if(err){
//                 console.log(err);
//             }
//             else{
//                 results.forEach(function(result){
//                     if(result.indexOf(searchQ)!= -1)
//                     {
//                         if(hint === ""){
//                             hint= "<li>" + result.bookname  +"</li>"
//                         }else{
//                             hint = hint + "<br /> <li>" + result.bookname + "</li>";
//                         }
//                     }
//                 }) 
//             }
//             if(hint === ""){
//                 response = "no response"
//             }else{
//                 response = hint;
//             }
//             res.send({response: response});
//         })
//     }
// })

// router.get('/booksname', (req, res)=>{
//     let regex = new RegExp(req.query["term"], 'i');
//     var bookfilter = Book.find({bookid: regex}, {'bookid': 1}).sort({"updated_at": -1}).sort({"created_at": -1}).limit(20);
//     bookfilter.exec(function(err, data){
//         console.log(data);
//         let result=[];
//         if(!err){
//             if(data && data.length && data.length>0){
//                 data.forEach(user=>{
//                     let obj = {
//                         id: user.bookid,
//                         label: user.bookid
//                     };
//                     result.push(obj);
//                 });
//             }
//             res.jsonp(result);
//         }
//     });
// })

module.exports = router;




