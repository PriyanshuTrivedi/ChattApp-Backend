const mongoose=require('mongoose');

const msgSchema=new mongoose.Schema({
    senderEmail:{
        type:String,
        required:true
    },
    receiverEmail:{
        type:String,
        required:true
    },
    msg:{
        type:String,
        required:true
    }
},{timestamps:true});

const msgModel=mongoose.model('Message',msgSchema);

module.exports=msgModel;