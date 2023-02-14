const mongoose = require('mongoose');

const topicmanagerSchema = mongoose.Schema({
    userId: String,
    userFullname: String,
    userPassword: String,
    topicId: String,
    userRole: {type: String, default: 'topic_manager'},
    userSubscriptionCategory: {type: String, default: 'basic'},
    adminApproved: {type: Number, default: 1},
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("TopicManagers", topicmanagerSchema);