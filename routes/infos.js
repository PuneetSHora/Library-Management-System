let express = require('express');
let uniqid = require('uniqid');
let nodemailer = require('nodemailer');
let passport = require('passport');
let bcrypt = require('bcrypt');
let router = express.Router();
let Info = require('../models/infos').Info;
let ejs = require('ejs');
let Book = require('../models/books').Book;
let Issue = require('../models/issues').Issue;
let cookieParser = require('cookie-parser');
const port = 8000;

let { ensureAuthenticated } = require('../config/auth');

let cryptr = require('cryptr');
cryptr = new cryptr('password');

router.post('/login', async(req, res, next)=> {

    let reqBody = req.body;
    let email = reqBody.email;
    let enroll = reqBody.enroll;
    let user = await Info.find().where({email: email});
    
    if(enroll!="")
    {
        if(user.length > 0)
        {
            if(user[0].enroll == 'admin' && user[0].enroll == enroll)
            {
                passport.authenticate('local', {
                successRedirect: '/infos/admin',
                failureRedirect: '/infos/adminlogin',
                failureFlash: true
             })(req, res.cookie('enroll', enroll), res.cookie('email',email), next)
            }   
            else if(user[0].enroll == enroll){
                    passport.authenticate('local', {
                    successRedirect: '/infos/dashboard',
                    failureRedirect: '/infos/login',
                    failureFlash: true
                })(req, res.cookie('enroll',enroll), res.cookie('email',email), next)
            }
            else if(user[0].enroll!=enroll && enroll=='admin'){
                req.flash('enroll_msg','Please enter the correct email-id');
                res.redirect('/infos/adminlogin');
            }
            else if(user[0].enroll!=enroll){
                req.flash('enroll_msg','Please enter the correct enrollment number and email-id');
                res.redirect('/infos/login');
            }
        }
        else if(enroll=='admin'){
            passport.authenticate('local', {
                successRedirect: '/infos/register',
                failureRedirect: '/infos/adminlogin',
                failureFlash: true
             })(req, res, next)
        }
        else{
            passport.authenticate('local', {
                successRedirect: '/infos/register',
                failureRedirect: '/infos/login',
                failureFlash: true
             })(req, res, next)
        }
    }
    else if(enroll == 'admin'){
        req.flash('enroll_msg','Please enter the correct email id');
        res.redirect('/infos/adminlogin');
    }
    else{
        req.flash('enroll_msg','Please enter the correct enrollment number and email-id');
        res.redirect('/infos/login');
    }
    // let reqBody = req.body;
    // let email = reqBody.email;
    // let password = reqBody.password;
    // console.log(email);
    // console.log(password);
    //console.log('working');
    // let reqBody = req.body;
    // let email = reqBody.email;
    // //let pwd = reqBody.password;
    // initializePassport(passport, email => Info.find().where({email: email}));

    // console.log(email);
    // console.log(pwd);
})

router.get('/login', async(req, res)=>{
    res.render('login');
})

router.get('/adminlogin', (req, res)=>{
    res.render('adminlogin');
})

router.use(cookieParser());

//logout
router.get('/logout', (req, res)=>{
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
})

router.get('/regsiter', (req, res)=> {
    res.render('register');
})

router.get('/passwordup', async(req, res)=>{
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    let user = await Info.findOne({enroll: enroll, email: email});
    res.render('passwordup',{
        name: user.first
    });
})

router.post('/passwordup', async(req, res)=>{
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    let oldpwd = req.body.oldpwd;
    let newpwd = req.body.newpwd;
    let conpwd = req.body.conpwd;
    let user = await Info.findOne({enroll: enroll, email: email});
    let incorrect_msgs = [];
    let compare_res = await bcrypt.compare(oldpwd, user.password);
    if(compare_res)
    {
        if(newpwd!=conpwd)
        {
            incorrect_msgs.push({msg: 'New passoword and confirm passoword are not same, please enter again'});
            res.render('passwordup',{
                incorrect_msgs,
                name: user.first
            })
        }

        else{
            let encryptedPass = await bcrypt.hash(newpwd, 12);
            await Info.findOneAndUpdate({enroll: enroll}, {
                $set: {
                    password: encryptedPass,
                    flag: 1
                }
            }).then(user=>{
                req.flash('pwd_msg', 'Password updated successfully');
                res.redirect('/infos/login');
            })
        }
    }
    else{
        incorrect_msgs.push({msg: 'You have entered a wrong passowrd'});
        res.render('passwordup',{
            incorrect_msgs,
            name: user.first
        })
    }
})

router.get('/dashboard', ensureAuthenticated, async(req,res) => {
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    let user = await Info.findOne({enroll: enroll, email: email});
    let booksissued = await Issue.find().where({studentid: enroll});
    let no_books = [];
    let index = 1;
    let num = 1;
    let d = new Date();
    // console.log(d.getTime());
    // console.log(d);
    // console.log(OriginalReturn.getTime());
    // console.log(OriginalReturn);
    // while(d.getTime()>OriginalReturn.getTime()){
    //     OriginalReturn.setDate(OriginalReturn.getDate()+1);
    //     fine = fine + 10;
    //     //console.log(fine);
    // }
    booksissued.forEach( async(issue)=>{
        let fine = 0;
        let OriginalReturn = issue.OriginalReturn;
        let bookid = issue.bookid;
        while(d.getTime()>OriginalReturn.getTime()){
            OriginalReturn.setDate(OriginalReturn.getDate()+1);
            fine = fine + 10;
            // console.log(fine);
            // console.log(OriginalReturn.getTime());
            // console.log(d.getTime());
            //console.log(fine);
        }
        // if(d.getTime()==OriginalReturn.getTime()){
        //     console.log('true');
        // }
        issue.fine = fine;
        await Issue.findOneAndUpdate({bookid: bookid}, {
            $set: {
                fine: fine
            }
        })
    })
    // booksissued.forEach((issue)=>{
    //     console.log(issue.fine);
    // })
    //console.log(booksissued);
   Book.find().exec((err, books)=>{
    let bookmsgs = [];
    if(booksissued.length==0){
        no_books.push({msg: 'No book issued yet'})
        if(books.length == 0){
            bookmsgs.push({msg: 'No Books Available'});
            res.render('dashboard',{
                bookmsgs,
                books: books,
                name: user.first,
                flag: user.flag,
                no_books,
                booksissued: booksissued,
                searched: ""
            })
        }
        else{
            res.render('dashboard',{
                num: num,
                books: books,
                name: user.first,
                flag: user.flag,
                no_books,
                booksissued: booksissued,
                searched: ""
            })
        }
    }
    else{
        if(books.length == 0){
            bookmsgs.push({msg: 'No Books Available'});
            res.render('dashboard',{
                bookmsgs,
                books: books,
                name: user.first,
                flag: user.flag,
                index,
                booksissued: booksissued,
                searched: ""
            })
        }
        else{
            res.render('dashboard',{
                num: num,
                books: books,
                name: user.first,
                flag: user.flag,
                index,
                booksissued: booksissued,
                searched: ""
            })
        }
    }
   })
})


router.post('/admin/:enroll', async(req, res)=>{
    let roll = req.params.enroll;
    let student = await Info.findOneAndRemove({enroll: roll});
    await student.remove();
    res.redirect('/infos/admin');
})

router.get('/profile', ensureAuthenticated, async(req,res)=>{
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    //console.log(enroll);
    let user = await Info.findOne({enroll: enroll, email: email});
    res.render('profile',{
        enroll: user.enroll,
        first: user.first,
        last: user.last,
        email: user.email,
        phone: user.phone
    })
})


router.get('/admin', ensureAuthenticated, (req,res) => {
    Book.find().exec((err, books)=>{
        let bookmsgs = [];
        let studentmsgs = [];
        let issuemsgs = [];
        let pageload = req.cookies['pageload'];
        if(err) {
            throw err;
        }
        else{
            Info.find().exec((err, studentsinfo)=>{
                Issue.find().exec((err, issuedbook)=>{
                    let index = 1;
                    let num = 1;
                if(err){
                    throw err;
                }
                if(books.length==0)
                {
                    bookmsgs.push({msg: 'No Books Available'});
                    if(studentsinfo.length==2)
                    {
                        studentmsgs.push({msg: 'No Records Available'});
                        if(issuedbook.length==0)
                        {
                            issuemsgs.push({msg: 'No Books issued yet!'});
                            res.render('admin',{
                                bookmsgs,
                                studentmsgs,
                                issuemsgs,
                                searched: "",
                                books: books,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                        else{
                            res.render('admin',{
                                bookmsgs,
                                studentmsgs,
                                searched: "",
                                num: num,
                                books: books,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                    }
                    else{
                        if(issuedbook.length==0)
                        {
                            issuemsgs.push({msg: 'No Books issued yet!'});
                            res.render('admin',{
                                bookmsgs,
                                issuemsgs,
                                searched: "",
                                books: books,
                                index: index,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                        else{
                            res.render('admin',{
                                bookmsgs,
                                searched: "",
                                books: books,
                                index: index,
                                num: num,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                    }
                }
                else if(studentsinfo.length==2)
                {
                    studentmsgs.push({msg: 'No Records Available'});
                    if(issuedbook.length==0)
                        {
                            issuemsgs.push({msg: 'No Books issued yet!'});
                            res.render('admin',{
                                issuemsgs,
                                studentmsgs,
                                searched: "",
                                books: books,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                        else{
                            res.render('admin',{
                                studentmsgs,
                                searched: "",
                                books: books,
                                index: index,
                                num: num,
                                studentsinfo: studentsinfo,
                                issuedbook: issuedbook,
                                pageload: pageload
                            });
                        }
                }
                else{
                    if(issuedbook.length==0)
                    {
                        issuemsgs.push({msg: 'No Books issued yet!'});
                        res.render('admin',{
                            issuemsgs,
                            searched: "",
                            books: books,
                            index: index,
                            studentsinfo: studentsinfo,
                            issuedbook: issuedbook,
                            pageload: pageload
                        });
                    }
                    else{
                        res.render('admin',{
                            searched: "",
                            books: books,
                            index: index,
                            num: num,
                            studentsinfo: studentsinfo,
                            issuedbook: issuedbook,
                            pageload: pageload
                        });
                    }
                }
                });
            });
        }
    });
    
});


router.post('/register', async(req, res)=> {
    let reqBody = req.body;
    let first = reqBody.first;
    let last = reqBody.last;
    let email = reqBody.email;
    let enroll = reqBody.rollno;
    let phone = reqBody.phone;
    let flag = 0;
    //let Id = uniqid();
    let password = uniqid();
    let password2 = password;
    console.log(password);
    let errors = [];
    if(!first || !last || !email || !enroll || !phone){
        errors.push({ msg: 'Please fill in all the details'});
    }
    if(errors.length>0)
    {
        res.render('register', {
            errors
        });
    }
    else{
        Info.findOne({ email: email})
            .then(user => {
                if(user){
                    errors.push({ msg: 'Email is already registerd'});
                    res.render('register', {
                        errors
                    });
                } else{
                    const newInfo = new Info({
                        date: new Date(),
                        first: first,
                        last: last,
                        email: email,
                        enroll: enroll,
                        phone: phone,
                        password: password,
                        flag: flag
                    });
                    bcrypt.genSalt(10, (err, salt)=>
                        bcrypt.hash(newInfo.password, salt, (err, hash)=>{
                            if(err) throw err;
                            newInfo.password = hash;
                            newInfo.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in')
                                    res.redirect('/infos/login');
                                })
                                .catch(err => console.log(err));
                        }))
                    let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                        user: 'puneetsingh240820@gmail.com',
                                        pass: 'Puneet@24'
                                    }
                                });
                    let fs = require('fs')
                            fs.readFile('./views/mail.ejs', 'utf8', (err, data) => {
                                if (err) {
                                    return console.log(err);
                                }
                                let mainOptions = {
                                    from: 'puneetsingh240820@gmail.com',
                                    to: email,
                                    subject: 'Login Details',
                                    html: ejs.render(data, {email: email, password: password2})
                            };
                        //console.log(mainOptions.html);
                                transporter.sendMail(mainOptions, (err,info)=>{
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        console.log('Message sent: '+ info.response);
                                    }
                        });
                })
    }
})
    }
    // if(user.length === 0){
    //     let encryptedpass = await bcrypt.hash(password, 12);
    //     let newInfo = new Info({
    //         id: Id,
    //         date: new Date(),
    //         first: reqBody.first,
    //         last: reqBody.last,
    //         email: reqBody.email,
    //         phone: reqBody.phone,
    //         password: encryptedpass
    //     })

    //     let transporter = nodemailer.createTransport({
    //         service: 'gmail',
    //         auth: {
    //             user: 'puneetsingh240820@gmail.com',
    //             pass: 'Puneet@24'
    //         }
    //     });
    //     let mailOptions = {
    //         from: 'puneetsingh240820@gmail.com',
    //         to: email,
    //         subject: 'Student Registrtion details',
    //         text: `username/email id: ${email} 
    //         password: ${Id}`
    //     };
    //     transporter.sendMail(mailOptions, function(error,info){
    //         if(error){
    //             console.log(error);
    //         }
    //         else{
    //             console.log('Email sent: '+ info.response);
    //         }
    //     })
    //     await newInfo.save();
    //     res.send('Created');
    // }
    // else{
    //     res.send('rejected');
    // }
})

router.get('/home', (req, res)=>{
    res.render('home');
})

router.get('/forgotpass', (req, res)=>{
    res.render('forgotpass');
})

router.post('/forgotpass', async(req,res)=>{
    let email = req.body.email;
    let info = await Info.find().where({email: email});
    if(info != 0)
    {
        let enroll = info[0].enroll;
        let encryptedemail = cryptr.encrypt(email);
        let encryptedenroll = cryptr.encrypt(enroll);
        console.log(encryptedenroll);
        console.log(encryptedemail);
        req.flash('newpass_mail', 'Password reset link has been sent successfully on the given email-id');
        res.redirect('/infos/login');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
                 auth: {
                    user: 'puneetsingh240820@gmail.com',
                    pass: 'Puneet@24'
                }
        });
        let fs = require('fs')
            fs.readFile('./views/newpass.ejs', 'utf8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
            let mainOptions = {
                from: 'puneetsingh240820@gmail.com',
                to: email,
                subject: 'Forgot Password',
                html: ejs.render(data, {email: encryptedemail, enroll: encryptedenroll})
            };
//console.log(mainOptions.html);
            transporter.sendMail(mainOptions, (err,info)=>{
                if(err){
                    console.log(err);
                }
                else{
                    console.log('Message sent: '+ info.response);
                }
            }); 

        });
    }
    // bcrypt.genSalt(10, (err, salt)=>
    // bcrypt.hash(enroll, salt, (err, hash)=>{
    //     if(err) throw err;
    //     encryptedenroll = hash;
    // }))
    // bcrypt.genSalt(10, (err, salt)=>
    //     bcrypt.hash(email, salt, (err, hash)=>{
    //         if(err) throw err;
    //         encryptedenroll = hash;
    //         encryptedemail = hash;
    // }))
    // req.flash('newpass_mail', 'Mail sent successfully');
    // res.redirect('/');
    // let encryptedenroll = async(enroll)=>{
    //     let encryptenroll = await bcrypt.hash(enroll, 12);
    //     return encryptenroll;
    // }
    // let encryptenroll = encryptedenroll(enroll);
    // let encryptedemail = async(email)=>{
    //     let encryptemail = await bcrypt.hash(email, 12);
    //     return encryptemail;
    // }
    // let encryptemail = encryptedemail(email);

    // function encryptemail(email) {
    //     let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    //     let encrypted = cipher.update(email);
    //     encrypted = Buffer.concat([encrypted, cipher.final()]);
    //     return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    // }

    // let encryptedemail = encryptemail(email);

    // function encryptenroll(enroll) {
    //     let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    //     let encrypted = cipher.update(enroll);
    //     encrypted = Buffer.concat([encrypted, cipher.final()]);
    //     return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    // }

    // let encryptedenroll = encryptenroll(enroll);

    // let encryptedemail = await bcrypt.hash(email, 12);
    // let encryptedenroll = await bcrypt.hash(enroll, 12);
    // req.flash('newpass_mail', 'Mail sent successfully');
    // res.redirect('/');

    // let encryptedenroll = await bcrypt.hash(enroll, 3);
    // let encryptedemail = await bcrypt.hash(email, 3);
    // console.log(encryptedenroll);
    // console.log(encryptedemail);
    // req.flash('newpass_mail', 'updated');
    // res.redirect('/');
        // await Info.findOneAndUpdate({enroll: enroll}, {
        //         $set: {
        //             email: encryptedemail,
        //             enroll: encryptedenroll
        //         }
        // }).then(user=>{
        //         req.flash('newpass_mail', 'updated');
        //         res.redirect('/');
        //     })

    // function encryptemail(email) {
    //         let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    //         let encrypted = cipher.update(email);
    //         encrypted = Buffer.concat([encrypted, cipher.final()]);
    //         encryptedData = encrypted.toString('hex');
    //         return encryptedData;
    //     }
    // let encryptedemail = encryptemail(email);

    // function encryptenroll(enroll) {
    //     let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    //     let encrypted = cipher.update(enroll);
    //     encrypted = Buffer.concat([encrypted, cipher.final()]);
    //     encryptedData = encrypted.toString('hex');
    //     return encryptedData;
    // }
    // let encryptedenroll = encryptenroll(enroll);

    else{
        req.flash('incorrect_pwd', 'Email-id not found!');
        res.redirect('/infos/login');
    }
})

// router.get('/hello/:id/:first', (req, res)=>{
//     let id = req.params.id;
//     let first = req.params.first;
//     console.log(id);
//     console.log(first);
//     res.redirect('/');
// })

router.get('/passchange/:email/:enroll', (req, res)=>{
    let email = req.params.email;
    let enroll = req.params.enroll;
    console.log(email);
    console.log(enroll);
    res.render('passchange', {
        email: email,
        enroll: enroll
    });
})

router.post('/passchange/:email/:enroll', async(req, res)=>{
    let email = req.params.email;
    let enroll = req.params.enroll;
    console.log(email + "2");
    console.log(enroll + "2");
    let newpass = req.body.newpass;
    let confirmpass = req.body.confirmpass;
    console.log(newpass);
    console.log(confirmpass);
    // function emaildecrypt(email) {
    //     let encryptedText = email;
    //     let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    //     let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    //     decrypted = Buffer.concat([decrypted, decipher.final()]);
    //     return decrypted.toString();
    // }

    // let decryptedemail = emaildecrypt(email);

    // function enrolldecrypt(enroll) {
    //     let encryptedText = enroll; 
    //     let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    //     let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    //     decrypted = Buffer.concat([decrypted, decipher.final()]);
    //     return decrypted.toString();
    // }

    // let decryptedenroll = enrolldecrypt(enroll);

    let decryptedemail = cryptr.decrypt(email);
    let decryptedenroll = cryptr.decrypt(enroll);

    console.log(decryptedemail);
    console.log(decryptedenroll);

    let info = await Info.findOne({ email: decryptedemail, enroll: decryptedenroll });

    if(info.length!=0)
    {
        if(newpass!=confirmpass)
        {
            req.flash('incorrect_pwd', 'Passwords not matched, please try again');
            res.redirect('/');
        }

        else{
            let password =  await bcrypt.hash(newpass, 12);;
            await Info.findOneAndUpdate({enroll: decryptedenroll}, {
                $set: {
                    password: password
                }
            }).then(user=>{
                req.flash('newpwd_msg', 'Password updated successfully');
                res.redirect('/infos/login');
            })
        } 
    }
    else{
        req.flash('incorrect_pwd', 'Email-id not found!');
        res.redirect('/infos/login');
    }

})

module.exports = router;