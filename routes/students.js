let express = require('express');
let router = express.Router();
let Info = require('../models/infos').Info;
let cookieParser = require('cookie-parser');

let { ensureAuthenticated } = require('../config/auth');

router.use(cookieParser());

router.get('/studentprofile', ensureAuthenticated, async(req,res)=>{
    let enroll = req.cookies['enroll'];
    let email = req.cookies['email'];
    //console.log(enroll);
    let user = await Info.findOne({enroll: enroll, email: email});
    res.render('studentprofile',{
        enroll: user.enroll,
        first: user.first,
        last: user.last,
        email: user.email,
        phone: user.phone
    })
})

router.get('/studentsearch', async(req, res)=>{
    let infos = await Info.find();
    res.render('studentsearch', {
        studentsinfo: infos,
        searched: ""
    });
})

router.post('/studentsearch', async(req, res)=>{
    let search = req.body.studentsearch;
    let studentbyid = await Info.find().where({enroll: search});
    let nostudents = [];
    let index = 1;

    if(studentbyid!=0)
    {
        if(studentbyid!=0)
        {
            res.render('studentsearch',{
                index: index,
                studentsinfo: studentbyid,
                searched: search
            })
        }
    }
    else{
        nostudents.push({msg: 'No Such Student Available'});
        res.render('studentsearch',{
            nostudents,
            studentsinfo: studentbyid,
            searched: search
        })
    }

})


module.exports = router;