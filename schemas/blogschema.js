const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    blogimage: {
        type: String,
        required: true,
    },
    username : {
        type : String,
    }
}, { timestamps: true })

const blogModel = mongoose.model('blogs', blogSchema)
module.exports = { blogModel }