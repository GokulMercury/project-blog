const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { response } = require('express');

mongoose.connect('mongodb://localhost/blog');

const Articles = require('../../model/article_model.js');
const Topics = require('../../model/topic_model.js');

router.route('/')
.get(async (req,res)=>{
  const user = req.session.userCategory;
  console.log(req.session)
    Articles.find({adminApproved:1}, (err, articles) => {
        if (err) {
          // Handle the error here
        }
        res.render('home_view', {articles:articles.reverse()});
      });
})

module.exports = router;