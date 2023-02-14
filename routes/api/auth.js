const express = require('express');
const router = express.Router();
const validator = require('validator');
const bcrypt = require('bcrypt');


const Users = require('../../model/user_model.js');
const TopicManagers = require('../../model/topic_manager_model.js');
const Articles = require('../../model/article_model.js');
const Topics = require('../../model/topic_model.js');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blog');

router.route('/login')
.get((req,res)=>{
    res.render('login_view')
})
.post( (req,res)=>{
    if(!req.body.userId || !req.body.userPassword){
        res.status(400);
        console.log('enter details');
        res.render('login_view', {error:"Please enter the details"})
    } else {
        console.log(req.body)
        Users.find({userId: req.body.userId}, async (err, response)=>{
            const isMatch = await bcrypt.compare(req.body.userPassword, response[0].userPassword);
            if (!isMatch) {
                return res.render('login_view', {error:"Incorrect password"});
            }
            if(!response[0]){
                console.log('Check credentials');
                res.render('login_view', {error:"Check credentials"})
            } else {
                if(response[0].adminApproved === 1){
                    const validPassword = await bcrypt.compare(req.body.userPassword, response[0].userPassword);
                    console.log(req.body.userPassword,response[0].userPassword, response[0].userRole )
                    console.log(validPassword);
                    if (response[0].userId === req.body.userId && validPassword){
                        req.session.userId = response[0]._id;
                        //To find the total rating of a user
                        
                        console.log(req.session)
                        if (response[0].userRole =='admin'){
                            console.log('Admin');
                            res.redirect('/user/admin/dashboard');
                        } else{
                            Articles.aggregate([
                                { $match: 
                                    { blogOwnerId:req.session.userId.toString()} },
                                { $group: { _id: "$blogOwnerId", totalRating: { $sum: "$blogRating" } } }
                              ], (err,response)=>{
                                console.log(response[0].totalRating)
                                if (response[0].totalRating > 50){
                                    req.session.userCategory = 'premium';
                                    req.session.save();
                                    console.log('USER CATEGORY',req.session.userCategory)
                                } else {
                                    console.log('Basic');
                                    req.session.userCategory = 'basic';
                                    req.session.save();
                                    console.log('USER CATEGORY',req.session)
                                }
                            })
                            res.redirect('/user/dashboard');
                        }
                    } 
                } else {
                    console.log('Admin approval pending');
                    res.render('login_view', {error:"Admin approval pending"})
                } 
            }
        })
    }
})

//TOPIC MANAGER LOGIN
router.route('/login/topicmanager')
.get((req,res)=>{
    res.render('topic_manager_login_view')
})
.post( (req,res)=>{
    if(!req.body.userId || !req.body.userPassword){
        res.status(400);
        console.log('enter details');
        res.render('topic_manager_login_view', {error:"Please enter the details"})
    } else {
        console.log(req.body)
        TopicManagers.find({userId: req.body.userId}, async (err, response)=>{
            const isMatch = await bcrypt.compare(req.body.userPassword, response[0].userPassword);
            if (!isMatch) {
                return res.render('topic_manager_login_view', {error:"Incorrect password"});
            }

            if(!response[0]){
                console.log('Check credentials');
                res.render('topic_manager_login_view', {error:"Check credentials"})
            } else {
                if(response[0].adminApproved === 1){
                    const validPassword = await bcrypt.compare(req.body.userPassword, response[0].userPassword);
                    console.log(req.body.userPassword,response[0].userPassword )
                    console.log(validPassword);
                    if (response[0].userId === req.body.userId && validPassword){
                        req.session.userId = response[0]._id;
                        req.session.topicId = response[0].topicId;
                        
                        Articles.find({blogTopicId:response[0].topicId}, (err, articles) => {
                            if (err) {
                              // Handle the error here
                            }
                            Topics.find({_id:response[0].topicId}, (err,topics)=>{
                                console.log(topics)
                                if (err) {
                                    // Handle the error here
                                  }
                                  res.render('topic_manager_dashboard', {articles: articles, topicName:topics[0].topicName});
                            })
                            // Topics.find({_id:response[0].topicId}, (err,))
                            
                        });
                    } 
                } else {
                    console.log('Admin approval pending');
                    res.render('topic_manager_login_view', {error:"Admin approval pending"})
                } 
            }
        })
    }
})

//USER LOGIN
router.route('/signup')
.get((req,res)=>{
    res.render('signup_view')
})
.post(async (req,res)=>{
    console.log(req.body)
    
    //HASHING THE PASSWORD
    
    if(!req.body.userId || !req.body.userPassword || !req.body.userFullname){
        res.status(400);
        res.render('signup_view', {error:"Please enter the details"})
    } else {
        console.log(req.body)
        Users.find({userId: req.body.userId}, async (err, response)=>{
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(req.body.userPassword, salt);

            if(!response[0]){
                let newUser = new Users({
                    userId : req.body.userId,
                    userPassword : hashedPassword,
                    userFullname : req.body.userFullname
                })
                newUser.save((err,Users)=>{
                    if (err){
                        console.log('error');
                    } else {
                        console.log('success');
                        req.session.userId = req.body.userId;
                        res.redirect('/user/dashboard');
                    }
                })
            } else {
            if (response[0].userId == req.body.userId){
                userFLAG = 1;
                // req.session.user = user;
                console.log('user already exist');
                res.render('signup_view', {error: "User already exists. Please try to login"});
            } }
        })
    }
})

router.route('/logout')
.get((req,res)=>{
    req.session.destroy((err) =>{
        res.redirect('/');
    });
})

module.exports = router;