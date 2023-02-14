const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
    blogOwnerId: String,
    blogTitle : String,
    blogContent: String,
    blogTopicId: String,
    blogRating: {type: Number, default: 0},
    blogNoOfRating: {type: Number, default: 0},
    adminApproved: {type:Number, default:0},
    blogComment: [{
        commentUserId: String,
        commentText: String,
        createdAt: { type: Date, default: Date.now }
    }]
})
module.exports = mongoose.model('Articles', articleSchema);