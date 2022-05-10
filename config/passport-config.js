let LocalStrategy = require('passport-local').Strategy;
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');

let Info = require('../models/infos').Info;

module.exports = function(passport){
    passport.use(
        new LocalStrategy({ usernameField: 'email'}, (email, password, done)=>{
            Info.findOne({ email: email})
                .then(user=>{
                    if(!user){
                        return done(null, false, { message: 'That mail is not registered'});
                    }
                    bcrypt.compare(password, user.password, (err, isMatch)=>{
                        if(err) throw err;

                        if(isMatch) {
                            return done(null, user);
                        }
                        else{
                            return done(null, false, {message: 'Password incorrect'});
                        }
                    });
                })
                .catch(err=> console.log(err));
        })
    );
    passport.serializeUser((user, done) =>{
        done(null, user.id);
    });
    passport.deserializeUser((id, done)=>{
        Info.findById(id,(err, user)=> {
            done(err, user);
        });
    });
}