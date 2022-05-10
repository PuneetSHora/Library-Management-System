const cookieParser = require('cookie-parser');
let express = require('express');
const { Cookie } = require('express-session');
let router = express.Router();
let Issue = require('../models/issues').Issue;
let Book = require('../models/books').Book;
let Info = require('../models/infos').Info;
let { ensureAuthenticated } = require('../config/auth');

router.use(express.json());
//const querystring = require('querystring');

// const parseUrl = express.urlencoded({ extended: false });
// const parseJson = express.json({ extended: false });

// const checksum_lib = require("../paytm/checksum");
// const config = require("../paytm/config");


// let PUBLIC_KEY = "pk_test_51Kt6vUSALLEpJDVwAgNuKYFv7xDVoC5Baya9hJRrSDDbWoQmY8trlxscua0H9QfHsg6jT2aZsRXsffWPauGhrzwQ00PzIoHN6H";
// let SECRET_KEY = "sk_test_51Kt6vUSALLEpJDVwcIR4aq9QB3UCZNdiPxaLzXuFjGj6GD2C2iKasTxmJJD77zd1CGm72KT0wETNWbUP7gunMBGY00BUa0WddV";
// let stripe = require('stripe')(SECRET_KEY);

router.get('/issue/:bookid', async(req, res)=>{
    let id = req.params.bookid;
    let book = await Book.findOne({ bookid: id});
    if(book.issue == 1){
        req.flash('alreadyissued_msg', 'Book was already issued');
        res.redirect('/infos/admin');
    }
    else{
        res.render('issue', {
            bookid: id,
            bookname: book.bookname,
        })
    }
})


router.post('/issue/:bookid', async(req,res)=>{
    let id = req.params.bookid;
    let issuedate = new Date();
    let returndate = new Date();
    //console.log(returndate);
    let issue = 1;
    let reqBody = req.body;
    let enroll = reqBody.studentid;
    let book = await Book.findOne({ bookid: id});
    let info = await Info.find().where({enroll: enroll});
    let bookid = reqBody.bookid;
    if(info!=0)
    {
        await Book.findOneAndUpdate({bookid: id},{
            $set: {
                issue: issue
            }
        })
        //let days = reqBody.days;
       // console.log(days);
        returndate.setDate(returndate.getDate()+10);
        let returnday = returndate.getDate();
       // console.log(returnday);
        let returnmonth = returndate.getMonth()+1;
        //console.log(returnmonth);
        let returnyear = returndate.getFullYear();
        //console.log(returndate);
        let issueday = issuedate.getDate();
        let issuemonth = issuedate.getMonth()+1;
        let issueyear = issuedate.getFullYear();
        let finalissue = issuemonth+"/"+issueday+"/"+issueyear;
        let finalreturn = returnmonth+"/"+returnday+"/"+returnyear;
        let fine = 0;
        let newIssue = new Issue({
            OriginalReturn: returndate,
            bookid: bookid,
            bookname: reqBody.bookname,
            studentid: reqBody.studentid,
            studentname: reqBody.studentname,
            IssueDate: finalissue,
            ReturnDate: finalreturn,
            fine: fine
        })
        newIssue.save()
        .then(user =>{
            req.flash('bookissued_msg', 'Book Issued successfully');
            res.redirect('/infos/admin');
        })
    }
    else{
        res.render('issue', {
            bookid: book.bookid,
            bookname: book.bookname,
            notregistered_msg: 'Student not registered'
        })
    }
})

router.get('/issuedetail/:bookid', ensureAuthenticated, async(req, res)=>{
    let id = req.params.bookid;
    let issue = await Issue.findOne({ bookid: id });
    let d = new Date();
    let fine = 0;
    let OriginalReturn = issue.OriginalReturn;
    //console.log(d.getTime());
    //console.log(d);
    //console.log(OriginalReturn.getTime());
    //console.log(OriginalReturn);
    while(d.getTime()>OriginalReturn.getTime()){
        OriginalReturn.setDate(OriginalReturn.getDate()+1);
        fine = fine + 10;
        //console.log(fine);
    }
    issue.fine = fine;
    await Issue.findOneAndUpdate({bookid: id}, {
    $set: {
        fine: fine
        }
    })

    res.render('issuedetail', {
        studentid: issue.studentid,
        IssueDate: issue.IssueDate,
        ReturnDate: issue.ReturnDate,
        fine: fine
    })
})

router.post('/returnbook/:bookid', async(req, res)=>{
    let id = req.params.bookid;
    let issue = await Issue.find().where({bookid: id});

    if(issue[0].fine!=0)
    {
        req.flash('penalty_msg', 'Can not return, Penalty not paid');
        res.redirect('/infos/admin');
    }
    else{
        let issue = await Issue.findOneAndRemove({bookid: id});
        await issue.remove();
        await Book.findOneAndUpdate({bookid: id}, {
            $set: {
                issue: 0
            }
        }).then(user=>{
        req.flash('return_msg', 'Book Returned Successfully');
        res.redirect('/infos/admin');
    })
    }
})

router.get('/reissuebook/:bookid', async(req, res)=>{
    let id = req.params.bookid;
    let reissuedate = new Date();
    let returndate = new Date();
    returndate.setDate(returndate.getDate()+10);
    let returnday = returndate.getDay();
    console.log(returndate);
    console.log(returnday);
    //returndate.setMonth(returndate.getMonth+1);
    let returnmonth = returndate.getMonth() + 1;
    console.log(returnmonth);
    let returnyear = returndate.getFullYear();
    console.log(returndate);
    let reissueday = reissuedate.getDate();
    let reissuemonth = reissuedate.getMonth()+1;
    let reissueyear = reissuedate.getFullYear();
    let finalissue = reissuemonth+"/"+reissueday+"/"+reissueyear;
    let finalreturn = returnmonth+"/"+returnday+"/"+returnyear;
    await Issue.findOneAndUpdate({bookid: id},{
        $set: {
            IssueDate: finalissue,
            ReturnDate: finalreturn,
            OriginalReturn: returndate
        }
    }).then(user=>{
        req.flash('reissue_msg', 'Book Reissued Successfully');
        res.redirect('/infos/admin');
    })
})


// router.post('/pay/:bookid', async(req, res)=>{
//     let id = req.params.bookid;
//     let issue = await Issue.findOne({bookid: id});

//     // res.render('payment', {
//     //     key: PUBLIC_KEY,
//     //     name: issue.name,
//     //     fine: issue.fine * 100
//     // })

//     res.render('payment',{
//         bookid: issue.bookid,
//         studentid: issue.studentid,
//         fine: issue.fine 

//     })

// //     let id = req.params.bookid;
// //     let issue = await Issue.findOne({ bookid: id });
// //    res.render('payment', {
// //        name: issue.studentname,
// //        fine: issue.fine * 100,
// //        key: PUBLIC_KEY
// //    })
// })

// router.post('/payment', async(req, res)=>{
//     let session = await stripe.checkout.sessions.create({
//         payment_mehtod_types: ['card'],
//         mode: "payment",
//         line_items: [
//             {
//                price: price
//             }
//         ],
//         success_url: "http://localhost:8000/issues/success",
//         cancel_url: "http://localhost:8000/issues/cancel"
//     })
//     res.send({id: session.id});
// })

// router.get('/success', (req, res)=>{
//     res.render('success');
// })

// router.get('/cancel', (req, res)=>{
//     res.render('cancel');
// })

// router.post('/payment', async(req, res)=>{
//     let email = req.body.stripeEmail;
//     let issue = await Issue.findOne({ email: email });
//     stripe.customers.create({
//         email: req.body.stripeEmail,
//         source: req.body.stripeToken,
//         address:{
//             line1: '125 Vishnupuri Main Indore',
//             postal_code: '452001',
//             city: 'Indore',
//             state: 'Madhya Pradesh',
//             country: 'India'
//         }
//     })
//     .then((customer)=>{
//         return stripe.charges.create({
//             amount: issue.fine * 100,
//             description: issue.bookname + ' Book Penalty Payment',
//             currency: 'inr',
//             customer: customer.id
//         })
//     })
//     .then((charge)=>{
//         console.log(charge);
//         res.redirect('/infos/dashboard');
//     })
// })

// router.post("/payment", [parseUrl, parseJson], (req, res) => {
//     // Route for making payment
  
//     var paymentDetails = {
//       amount: req.body.amount,
//       customerId: req.body.name,
//       customerEmail: req.body.email,
//       customerPhone: req.body.phone
//   }
//   if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
//       res.status(400).send('Payment failed')
//   } else {
//       var params = {};
//       params['MID'] = config.PaytmConfig.mid;
//       params['WEBSITE'] = config.PaytmConfig.website;
//       params['CHANNEL_ID'] = 'WEB';
//       params['INDUSTRY_TYPE_ID'] = 'Retail';
//       params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
//       params['CUST_ID'] = paymentDetails.customerId;
//       params['TXN_AMOUNT'] = paymentDetails.amount;
//       params['CALLBACK_URL'] = 'http://localhost:8000/issues/callback';
//       params['EMAIL'] = paymentDetails.customerEmail;
//       params['MOBILE_NO'] = paymentDetails.customerPhone;
  
  
//       checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
//           var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
//           // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
  
//           var form_fields = "";
//           for (var x in params) {
//               form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
//           }
//           form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
//           res.writeHead(200, { 'Content-Type': 'text/html' });
//           res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
//           res.end();
//       });
//   }
//   });

//   router.post("/callback", (req, res) => {
//     // Route for verifiying payment
  
//     var body = '';
  
//     req.on('data', function (data) {
//        body += data;
//     });
  
//      req.on('end', function () {
//        var html = "";
//        var post_data = qs.parse(body);
  
//        // received params in callback
//        console.log('Callback Response: ', post_data, "\n");
  
  
//        // verify the checksum
//        var checksumhash = post_data.CHECKSUMHASH;
//        // delete post_data.CHECKSUMHASH;
//        var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
//        console.log("Checksum Result => ", result, "\n");
  
  
//        // Send Server-to-Server request to verify Order Status
//        var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};
  
//        checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
//          params.CHECKSUMHASH = checksum;
//          post_data = 'JsonData='+JSON.stringify(params);
  
//          var options = {
//            hostname: 'securegw-stage.paytm.in', // for staging
//            // hostname: 'securegw.paytm.in', // for production
//            port: 443,
//            path: '/merchant-status/getTxnStatus',
//            method: 'POST',
//            headers: {
//              'Content-Type': 'application/x-www-form-urlencoded',
//              'Content-Length': post_data.length
//            }
//          };
  
  
//          // Set up the request
//          var response = "";
//          var post_req = https.request(options, function(post_res) {
//            post_res.on('data', function (chunk) {
//              response += chunk;
//            });
  
//            post_res.on('end', function(){
//              console.log('S2S Response: ', response, "\n");
  
//              var _result = JSON.parse(response);
//                if(_result.STATUS == 'TXN_SUCCESS') {
//                    res.send('payment sucess')
//                }else {
//                    res.send('payment failed')
//                }
//              });
//          });
  
//          // post the data
//          post_req.write(post_data);
//          post_req.end();
//         });
//        });
//   });

router.get('/pay/:bookid', ensureAuthenticated, async(req, res)=>{
    let id = req.params.bookid;
    let issue = await Issue.findOne({bookid: id});
    res.render('pay', {
        bookid: issue.bookid,
       studentid: issue.studentid,
        fine: issue.fine
    })
})

router.post('/pay/:bookid', async(req, res)=>{
    let id = req.params.bookid;
    let issue = await Issue.findOne({bookid: id});

    res.cookie('studentid', issue.studentid);
    res.cookie('bookid', issue.bookid);
    res.render('checkout',{
        studentname:issue.studentname,
        bookid: issue.bookid,
        studentid: issue.studentid,
        fine: issue.fine
    }); 
})

router.post('/bookissuedsearch', async(req, res)=>{
    let search = req.body.issuesearch;
    let bookbyid = await Issue.find().where({bookid: search});
    let bookbyname = await Issue.find().where({bookname: search});
    let searchstudentid = await Issue.find().where({studentid: search});
    let noissued = [];
    let num = 1;

    if(bookbyid!=0 || bookbyname!=0 || searchstudentid!=0)
    {
        if(bookbyid!=0)
        {
            res.render('bookissuedsearch',{
                books: bookbyid,
                num: num,
                searched: search
            })
        }
        if(bookbyname!=0)
        {
            res.render('bookissuedsearch',{
                books: bookbyname,
                num: num,
                searched: search
            })
        }
        if(searchstudentid!=0)
        {
            res.render('bookissuedsearch',{
                books: searchstudentid,
                num: num,
                searched: search
            })
        }
    }
    else{
        noissued.push({msg: 'No Such Book Issued Yet'});
        res.render('bookissuedsearch',{
            noissued,
            books: bookbyid,
            searched: search
        })
    }

})

module.exports = router;

