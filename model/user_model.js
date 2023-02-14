const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userId: String,
    userFullname: String,
    userPassword: String,
    userRole: {type: String, default: 'user'},
    userSubscriptionCategory: {type: String, default: 'basic'},
    adminApproved: {type: Number, default: 1},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Users", userSchema);