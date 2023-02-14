const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    topicName: String,
    topicDescription: String,
    blogTopic: String,
    blogRating: Number,
    createdAt: { type: Date, default: Date.now },
})
module.exports = mongoose.model('Topics', topicSchema);