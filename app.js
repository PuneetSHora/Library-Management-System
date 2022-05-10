require('dotenv').config();
let express = require('express');
let app = express();
let mongoose = require('mongoose');
let flash = require('connect-flash');
let session = require('express-session');
let cryptr = require('cryptr');
const port = 8000;
let InfosRouter = require('./routes/infos');
let BooksRouter = require('./routes/books');
let StudentsRouter = require('./routes/students');
let IssuesRouter = require('./routes/issues');
let passport = require('passport');
const { application } = require('express');
mongoose.connect('mongodb://localhost/LMS', { useNewUrlParser: true });
app.use(express.static("public"));
let Info = require('./models/infos').Info;
let Issue = require('./models/issues').Issue

let { ensureAuthenticated } = require('./config/auth');

let cookieParser = require('cookie-parser');
app.use(cookieParser());

let stripe = require("stripe")('sk_test_51Kt6vUSALLEpJDVwcIR4aq9QB3UCZNdiPxaLzXuFjGj6GD2C2iKasTxmJJD77zd1CGm72KT0wETNWbUP7gunMBGY00BUa0WddV');

app.set('view engine', 'ejs');

app.use(express.json());

//BodyParser
app.use(express.urlencoded({ extended: false }));

//Passport Config
require('./config/passport-config')(passport);

//Express Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global vars
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.booksaved_msg = req.flash('booksaved_msg');
    res.locals.enroll_msg = req.flash('enroll_msg'); 
    res.locals.update_msg = req.flash('update_msg');
    res.locals.bookissued_msg = req.flash('bookissued_msg');
    res.locals.alreadyissued_msg = req.flash('alreadyissued_msg'); 
    res.locals.notregistered_msg = req.flash('notregistered_msg'); 
    res.locals.pwd_msg = req.flash('pwd_msg');
    res.locals.return_msg = req.flash('return_msg');  
    res.locals.reissue_msg = req.flash('reissue_msg');  
    res.locals.newpass_mail = req.flash('newpass_mail');
    res.locals.newpwd_msg = req.flash('newpwd_msg');
    res.locals.incorrect_pwd = req.flash('incorrect_pwd');   
    res.locals.penalty_msg = req.flash('penalty_msg'); 
    next();
})


app.use('/infos', InfosRouter);
app.use('/books', BooksRouter);
app.use('/students', StudentsRouter);
app.use('/issues', IssuesRouter);


app.get('/', (req, res)=> {
    res.render('index');
})

app.get('/checkout', (req, res)=>{
    res.render('checkout');
})

app.get('/success', ensureAuthenticated, async(req, res)=>{
    let bookid = req.cookies['bookid'];
    let studentid = req.cookies['studentid'];
    let issue = Issue.findOne({bookid: bookid, studentid: studentid});
    let returndate = new Date();
    returndate.setDate(returndate.getDate()+2);
    let returnday = returndate.getDate();
    console.log(returndate);
    console.log(returnday);
    //returndate.setMonth(returndate.getMonth+1);
    let returnmonth = returndate.getMonth() + 1; 
    console.log(returnmonth);
    let returnyear = returndate.getFullYear();
    console.log(returndate);
    let finalreturn = returnmonth+"/"+returnday+"/"+returnyear;
    await Issue.findOneAndUpdate({bookid: bookid},{
        $set: {
            ReturnDate: finalreturn,
            OriginalReturn: returndate
        }
    })
    res.render('success');
})

app.get('/cancel', ensureAuthenticated, (req, res)=>{
    res.render('cancel');
})

app.post('/payment', async(req, res)=>{
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    //console.log(enroll);
    let user = await Issue.findOne({enroll: enroll});

    const{product} = req.body;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data:{
                    currency: 'inr',
                    product_data: {
                        name: product.name
                    },
                    unit_amount: product.amount * 100,
                },
                quantity: product.quantity
            }
        ],
        mode: 'payment',
        success_url: 'http://localhost:8000/success',
        cancel_url: 'http://localhost:8000/cancel'
    })
    res.json({id: session.id});
})


app.listen(port, () => console.log('Listening 8000...'));