const express = require('express');
const router = express.Router();
const validator = require('validator');

const mongoose = require('mongoose');
const { response } = require('express');
mongoose.connect('mongodb://localhost/blog');

const Articles = require('../../model/article_model.js');
const Topics = require('../../model/topic_model.js');

const authenticate = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
      res.redirect('/auth/login');
  }
};

const authenticatePremiumUser = (req, res, next) => {
  console.log(req.session.userCategory)
  if (req.session && req.session.userId && req.session.userCategory =='premium' ) {
    next();
  } else {
    Articles.find({adminApproved:1}, (err, articles) => {
      console.log(articles.blogNoOfRating);
      if (err) {
        // Handle the error here
      }
      res.render('home_view', {articles:articles.reverse(), message: "You should login as a premium user to add rating", type: 'error'});
    });
  }
};

router.route('/')
.get(authenticate, (req,res)=>{
    res.send('in article')
})

//User - To manage articles
router.route('/manage')
.get(authenticate, (req,res)=>{
    res.render('user_manage_article_view')
})

//To add article
router.route('/add')
.get(authenticate, (req,res)=>{
    Topics.find({}, (err, topics) => {
        if (err) {
          // Handle the error here
        }
        res.render('add_article_view', {topics:topics});
      });
    
})
.post(authenticate, (req,res)=>{
    console.log(req.body);
    console.log(req.session.userId)
    if(!req.body.blogTitle || !req.body.blogContent || !req.body.blogTopicId){
        res.status(400);
        console.log('Enter the content');
        res.render('add_article_view', {error:"Please enter the details"})
    } else{
        let newArticle = new Articles({
            blogOwnerId: req.session.userId,
            blogTopicId: req.body.blogTopicId,
            blogTitle: req.body.blogTitle,
            blogContent: req.body.blogContent
        })
        newArticle.save((err,Articles)=>{
            if(err) {
                console.log('error')
                res.render('/article/add', {message: 'Something went wrong', type:"error"});
            } else{
                console.log('Success');
                res.redirect('/user/dashboard');
            }
        })
    }
})

//For article details page
router.route('/details/:id')
.get((req,res)=>{
  const articleId = req.params.id;
  Articles.aggregate(
    // [{ "$match": { "adminApproved": { "$eq": 1} } }],
    [
      { $match: { _id: mongoose.Types.ObjectId(articleId), adminApproved: { $eq: 1 } } },
      {  $project: { blogTitle: 1, blogContent: 1, blogRating: 1,  
        averageRating: { 
          $cond: {
            if: { $eq:["$blogNoOfRating", 0]},
            then: 0,
              else: {$round: [{ $divide: [ "$blogRating", "$blogNoOfRating"]}, 1] }} 
            }
            
          }
          
        }
        
    ],
    (async (err, articles)=>{
      console.log(articles)
      const post = await Articles.findById(req.params.id);
      const blogComments = post.blogComment;
      console.log(blogComments)
      res.render('article_details_view', {articles:articles, blogComments});
    })
  )
})

//To approve or reject article
router.route('/approveReject/:id/:approve')
.get(authenticate, (req,res)=>{

    if(req.params.approve=='approve'){
        Articles.findByIdAndUpdate({_id:req.params.id}, {adminApproved:1}, (err, articles) => {
            if (err) {
              // Handle the error here
            }
            console.log('Article is approved');

            Articles.find({blogTopicId:req.session.topicId}, (err, articles) => {
                if (err) {
                  // Handle the error here
                }
                Topics.find({_id:req.session.topicId}, (err,topics)=>{
                    console.log(topics)
                    if (err) {
                        // Handle the error here
                      }
                      res.render('topic_manager_dashboard', {articles: articles, topicName:topics[0].topicName});
                })
                // Topics.find({_id:response[0].topicId}, (err,))
                
            });
          });  
    } else if(req.params.approve=='reject'){
        Articles.findByIdAndUpdate({_id:req.params.id}, {adminApproved:2}, (err, articles) => {
            if (err) {
              // Handle the error here
            }
            console.log('Article is rejected')
            Articles.find({blogTopicId:req.session.topicId}, (err, articles) => {
                if (err) {
                  // Handle the error here
                }
                Topics.find({_id:req.session.topicId}, (err,topics)=>{
                    console.log(topics)
                    if (err) {
                        // Handle the error here
                      }
                      res.render('topic_manager_dashboard', {articles: articles, topicName:topics[0].topicName});
                })
                // Topics.find({_id:response[0].topicId}, (err,))
                
            });
            // res.render('add_article_view', {topics:topics});
          });  
    }


    Articles.findByIdAndUpdate({_id:req.params.id}, (err, topics) => {
        if (err) {
          // Handle the error here
        }
        res.render('add_article_view', {topics:topics});
      });  
})

//Admin - to manage topics
router.route('/manage/topics')
.get(authenticate, (req,res)=>{
    Topics.find({}, (err, topics) => {
        if (err) {
          // Handle the error here
        }
        res.render('admin_manage_topics', {topics:topics});
      });
    
})

//Admin - to add topics
router.route('/add/topic')
.get(authenticate, (req,res)=>{
    res.render('add_topic_view')
})
.post((req,res)=>{
    console.log(req.session.userId);
    if(!req.body.topicName || !req.body.topicDescription){
        return res.render('add_topic_view', {error: 'Please add the details'});
    }
    let newTopic = new Topics({
        topicName: req.body.topicName,
        topicDescription: req.body.topicDescription
    })
    console.log(newTopic)
    newTopic.save((err,Topic)=>{
        if(err){
            console.log('error')
            res.render('add_topic_view', {error: 'Something went wrong'})
        } else{
            res.redirect('/article/manage/topics')
        }
    })
})

//To list topics
router.route('/topics/list')
.get(authenticate, (req,res)=>{
    
})

//Add comment
router.route('/:id/addcomment')
.post(authenticatePremiumUser, async(req,res)=>{
  const post = await Articles.findById(req.params.id);
  console.log(req.body.commentText)

  post.blogComment.push({
    commentText: req.body.commentText,
  });
  await post.save((err, response)=>{
    const articleId = req.params.id;
  Articles.aggregate(
    // [{ "$match": { "adminApproved": { "$eq": 1} } }],
    [
      { $match: { _id: mongoose.Types.ObjectId(articleId), adminApproved: { $eq: 1 } } },
      {  $project: { blogTitle: 1, blogContent: 1, blogRating: 1,  
        averageRating: { 
          $cond: {
            if: { $eq:["$blogNoOfRating", 0]},
            then: 0,
              else: {$round: [{ $divide: [ "$blogRating", "$blogNoOfRating"]}, 1] }} 
            }
            
          }
          
        }
        
    ],
    (async (err, articles)=>{
      console.log(articles)
      const post = await Articles.findById(req.params.id);
      const blogComments = post.blogComment;
      console.log(blogComments)
      res.render('article_details_view', {articles:articles, blogComments});
    })
  )
  });
})

//Add article rating
router.route('/:id/rating')
.post(authenticatePremiumUser, (req,res)=>{
    console.log(req.params.id, req.body);
    articleId = req.params.id;
    Articles.findOneAndUpdate({ _id: req.params.id }, { $inc: { blogRating: req.body.blogRating } }, { new: true }, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        Articles.findOneAndUpdate({ _id: req.params.id }, { $inc: { blogNoOfRating: 1 } }, { new: true }, async (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(result);
            Articles.aggregate(
              // [{ "$match": { "adminApproved": { "$eq": 1} } }],
              [
                { $match: {_id: mongoose.Types.ObjectId(articleId), adminApproved: { $eq: 1 } } },
                {  $project: { blogTitle: 1, blogContent: 1, blogRating: 1, 
                    averageRating: { $round: [{ $divide: [ "$blogRating", "$blogNoOfRating"]}, 1] }} }
              ],
              (async (err, articles)=>{
                console.log(articles)
                const post = await Articles.findById(req.params.id);
                const blogComments = post.blogComment;
                console.log(blogComments)
                res.render('article_details_view', {articles:articles, blogComments: blogComments});
              })
            )
          }
        });
      }
    });

})

module.exports = router;