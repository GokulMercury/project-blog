const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
const { response } = require('express');
mongoose.connect('mongodb://localhost/blog');

const Topics = require('../../model/topic_model.js');
const TopicManager = require('../../model/topic_manager_model.js');
const Articles = require('../../model/article_model.js');
const Users = require('../../model/user_model.js');

const authenticate = (req, res, next) => {
    if (req.session && req.session.userId) {
      next();
    } else {
      res.redirect('/auth/login');
    }
  };

router.route('/')
.get(authenticate, (req,res)=>{
    res.send('in user')
})

router.route('/dashboard')
.get(authenticate, (req,res)=>{
    res.render('user_dashboard_view');
})

router.route('/admin/dashboard')
.get(authenticate, (req,res)=>{
    res.render('admin_dashboard_view');
})

//TOPIC MANAGERS
router.route('/admin/topicmanagers/manage')
.get(authenticate, (req,res)=>{
    TopicManager.find({}, (err, topicmanagers) => {
        if (err) {
          // Handle the error here
        }
        res.render('manage_topic_managers', {topicmanagers:topicmanagers});
      });
})

router.route('/topicmanager/dashboard')
.get(authenticate, (req,res)=>{
    Articles.find({adminApproved:0}, (err, articles) => {
        if (err) {
          // Handle the error here
        }
        res.render('topic_manager_dashboard', {articles:articles});
      });
})

router.route('/admin/topicmanagers/add')
.get(authenticate, (req,res)=>{
    Topics.find({}, (err, topics) => {
        if (err) {
          // Handle the error here
        }
        res.render('add_topic_manager', {topics:topics});
      });
})
.post(authenticate, (req,res)=>{
    console.log(req.body)
    
    //HASHING THE PASSWORD
    
    if(!req.body.userId || !req.body.userPassword || !req.body.userFullname || !req.body.topicId){
        res.status(400);
        res.render('manage_topic_managers', {error:"Please enter the details"})
    } else {
        console.log(req.body)
        TopicManager.find({userId: req.body.userId}, async (err, response)=>{
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(req.body.userPassword, salt);

            if(!response[0]){
                let newTopicManager = new TopicManager({
                    topicId: req.body.topicId,
                    userId : req.body.userId,
                    userPassword : hashedPassword,
                    userFullname : req.body.userFullname
                })
                newTopicManager.save((err,Users)=>{
                    if (err){
                        console.log('error');
                    } else {
                        console.log('success');
                        TopicManager.find({}, (err, topicmanagers) => {
                            if (err) {
                              // Handle the error here
                            }
                            res.render('manage_topic_managers', {topicmanagers:topicmanagers, message:'New topic manager added.', type: 'success'});
                          });
                    }
                })
            } else {
            if (response[0].userId == req.body.userId){
                userFLAG = 1;
                console.log('user already exist');
                res.render('manage_topic_managers', {error: "Topic manager already exists."});
            } }
        })
    }
})

router.route('/admin/topicmanagers/edit/:id')
.get(authenticate, (req,res)=>{
    TopicManager.find({_id:req.params.id}, (err, topicmanager) => {
        if (err) {
          // Handle the error here
        }
        Topics.find({}, (err, topics) => {
            if (err) {
              // Handle the error here
            }
            req.session.topicManagerId = req.params.id;
            console.log(topicmanager)

            res.render('edit_topic_managers', {topicmanager:topicmanager, topics: topics});
          });
      });
})

router.route('/admin/topicmanagers/edit')
.post(authenticate, async (req,res)=>{
  if( !req.body.userPassword ){
    res.status(400);
        res.redirect('/user/admin/topicmanagers/edit/'+req.session.topicManagerId);
  } else{
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.userPassword, salt);

    TopicManager.findOneAndUpdate({_id:req.session.topicManagerId}, 
      { topicId: req.body.topicId,
        userId : req.body.userId,
        userPassword : hashedPassword,
        userFullname : req.body.userFullname
      }, (err, topicmanagers) => {
        if (err) {
          // Handle the error here
        }
        TopicManager.find({}, (err, topicmanagers) => {
            if (err) {
              // Handle the error here
            }
            res.render('manage_topic_managers', {topicmanagers:topicmanagers});
        });
    });
  }
})

router.route('/admin/topicmanagers/delete/:id')
.get(authenticate, (req,res)=>{
    TopicManager.findOneAndDelete({_id:req.params.id}, (err, articles) => {
        if (err) {
          // Handle the error here
        }

        TopicManager.find({}, (err, topicmanagers) => {
            if (err) {
              // Handle the error here
            }
            res.render('manage_topic_managers', {topicmanagers:topicmanagers});
        });
      });
})

//ADMIN TO MANAGE USERS
router.route('/admin/manage/users')
.get(authenticate, (req,res)=>{
    Users.find({}, (err, users) => {
        if (err) {
          // Handle the error here
        }
          console.log(users); 
          res.render('manage_users_view', {users:users});
      });
})

router.route('/admin/manage/users/approvereject/:id/:approve')
.get(authenticate, (req,res)=>{
  if(req.params.approve=='approve'){
    Users.findByIdAndUpdate({_id:req.params.id}, {adminApproved:1}, (err, users) => {
        if (err) {
          // Handle the error here
        }
        console.log('User is approved');
        
        Users.find({}, (err,users)=>{
                console.log(users)
                if (err) {
                    // Handle the error here
                  }
                  res.render('manage_users_view', {users: users});
            })
            // Topics.find({_id:response[0].topicId}, (err,))
            
        });
} else if(req.params.approve=='reject'){
  Users.findByIdAndUpdate({_id:req.params.id}, {adminApproved:0}, (err, users) => {
    if (err) {
      // Handle the error here
    }
    console.log('User is rejected');
    
    Users.find({}, (err,users)=>{
            console.log(users)
            if (err) {
                // Handle the error here
              }
              res.render('manage_users_view', {users: users});
        })
        // Topics.find({_id:response[0].topicId}, (err,))
        
    });
  }
})


module.exports = router;