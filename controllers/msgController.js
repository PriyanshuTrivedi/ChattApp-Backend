const express=require('express');
const msgRouter=express.Router();
const msgModel=require('../models/msg');
const userModel=require('../models/user');
const verifyToken = require('../middlewares/verifyToken');

msgRouter.post('/',verifyToken,async(req,res)=>{
    try{
        if(req.body.senderEmail===req.body.receiverEmail){
            throw new Error('Sender and Receiver cannot be same');
        }
        const msg=await msgModel.create(req.body);
        console.log('message added to db successfully');
        res.status(201).send(msg);
    }catch(err){
        console.log('error while adding message');
        return res.status(500).json(err.message);
    }
});

msgRouter.post('/chat',verifyToken,async(req,res)=>{
    try{
        const chats=await msgModel.find({
            $or:[
                {senderEmail:req.body.user1,receiverEmail:req.body.user2},
                {senderEmail:req.body.user2,receiverEmail:req.body.user1},
            ]
        }).sort({createdAt:1});
        console.log('fetched chat successfully');
        res.status(200).send(chats);
    }catch(err){
        console.log('error while fetching chat');
        return res.status(500).json(err.message);
    }
});


module.exports=msgRouter;