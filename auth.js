var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./models/user');
var router = require('express').Router();
var express = require('express')
var app = express()

module.exports = function (passport) {
    passport.serializeUser((user, req, done) => {
        done(null, req.profile);
    });
    passport.deserializeUser((id, done) => {
        done(null, id);
    });
    passport.use(new GoogleStrategy({
        clientID: "1006079380633-sm9icgovvukbcpnmuqvjaot0l01fj1kf.apps.googleusercontent.com",
        clientSecret: "T5cUeSFdasuAtFw8cL80vux-",
        callbackURL: '/auth/google/callback'
    }, (token, refreshToken, profile, done, req, res) => {

        User.findOne({
            googleId: profile.id
        }).then((currentUser) => {
            if (currentUser) {
                //User already exist
                done(null, {
                    currentUser: currentUser,
                    profile: profile,
                    token: token
                })
            } else {
                //Save User
                new User({
                    userName: profile.displayName,
                    googleId: profile.id,
                    email: profile.emails[0].value
                }).save().then((newUser) => {
                    done(null, {
                        currentUser: currentUser,
                        profile: profile,
                        token: token
                    })
                });
            }
        })
    }));
};
