const express=require('express');
const authRouter=express.Router();
const userModel=require('../models/user');
const msgModel=require('../models/msg');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const verifyToken=require('../middlewares/verifyToken');

const findLastMessageBtwGivenUsers=async(user1,user2)=>{
    try{
        const last_msg=await msgModel.find({
            $or:[
                {senderEmail:user1,receiverEmail:user2},
                {senderEmail:user2,receiverEmail:user1}
            ]
        }).sort({updatedAt:-1}).limit(1);
        if(last_msg.length>0){
            return last_msg[0];
        }
        return {
            senderEmail: user1,
            receiverEmail: user2,
            msg: "",
            createdAt: "2000-01-01T00:00:00.000Z",
            updatedAt: "2000-01-01T00:00:00.000Z"
        };
    }catch(err){
        console.log('Error is coming inside findLastMessageBtwGivenUsers function while finding last message')
        return err;
    }
}
authRouter.post('/getContacts',verifyToken,async(req,res)=>{
    try{
        const chats=await msgModel.find({
            $or:[
                {senderEmail:req.body.user},
                {receiverEmail:req.body.user},
            ]
        }).sort({createdAt:1});

        const distinctContactsWithLastMsg=new Map();
        for(const chat of chats){
            const contactEmail=(chat.senderEmail===req.body.user)?chat.receiverEmail:chat.senderEmail;
            if(!distinctContactsWithLastMsg.has(contactEmail) || distinctContactsWithLastMsg.get(contactEmail).createdAt<chat.createdAt){
                distinctContactsWithLastMsg.set(contactEmail,chat);
            }
        }
        const contactsArr=Array.from(distinctContactsWithLastMsg);
        const contactsEmail=contactsArr.map((el)=>el[0]);
        const usersInfo=await userModel.find({email:{$in:contactsEmail}});
        const userEmailToInfoMapping=new Map();
        usersInfo.map((el)=>{
            userEmailToInfoMapping.set(el.email,el);
        })
        const result=contactsArr.map((el)=>{
            return {
                contact:userEmailToInfoMapping.get(el[0]),
                lastMessage:el[1]
            }
        })
        result.sort((a, b) => {
            const dateA = new Date(a.lastMessage.updatedAt);
            const dateB = new Date(b.lastMessage.updatedAt);
            return dateB - dateA;
        });
        console.log(result);
        res.status(200).send(result);
    }catch(err){
        console.log(`error while fetching contacts`);
        return res.status(500).json(err.message);
    }
});

authRouter.post('/getLastMessage',verifyToken,async(req,res)=>{
    try{
        const last_msg=await findLastMessageBtwGivenUsers(req.body.user1,req.body.user2);
        console.log(last_msg);
        if(last_msg.length>0){
            return res.status(200).send(last_msg[0]);
        }
        return res.status(200).send({
            senderEmail: req.body.user1,
            receiverEmail: req.body.user2,
            msg: "",
            createdAt: "2000-01-01T00:00:00.000Z",
            updatedAt: "2000-01-01T00:00:00.000Z",});
    }catch(err){
        console.log(`error while fetching contacts`);
        return res.status(500).json(err.message);
    }
})

authRouter.post('/searchUser',verifyToken,async(req,res)=>{
    try{
        const users=await userModel.find({email:{$regex:req.body.searchParam, $options:'i'}});
        const result=[];
        for(const user of users){
            if(user.email==req.body.userEmail){
                continue;
            }
            const lastMessage=await findLastMessageBtwGivenUsers(req.body.userEmail,user.email);
            result.push({
                contact:user,
                lastMessage:lastMessage
            });
        }
        result.sort((a,b)=>{
            const dateA = new Date(a.lastMessage.updatedAt);
            const dateB = new Date(b.lastMessage.updatedAt);
            return dateB - dateA;
        })
        res.status(200).send(result);
    }catch(err){
        console.log('error while searching user');
        return res.status(500).json(err.message);
    }
})

authRouter.post('/register',async(req,res)=>{
    try{
        const alreadyExists=await userModel.findOne({email:req.body.email});
        if(alreadyExists){
            throw new Error("Email is already registered");
        }
        const hashedPassword=await bcrypt.hash(req.body.password,10);
        const userVals={
            username:req.body.username,
            email:req.body.email,
            password:hashedPassword
        };
        const addedUser=await userModel.create(userVals);
        const {password,...others}=addedUser._doc;
        const token=jwt.sign({id:addedUser._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        const sendRegisterResponse={others,token};
        console.log('Registered Successfully!');
        res.status(201).send(sendRegisterResponse);
    }catch(err){
        console.log('error while registering');
        return res.status(500).json(err.message);
    }
});

authRouter.post('/login',async(req,res)=>{
    try{
        console.log('backend login-yha to ara!')
        const user=await userModel.findOne({email:req.body.email});
        if (!user) {
            throw new Error('Wrong credentials. Try again!');
        }
        const compPass=await bcrypt.compare(req.body.password,user.password);
        if(!compPass){
            throw new Error('Wrong credentials. Try again!');
        }
        const {password,...others}=user._doc;
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        const sendLoginResponse={others,token};
        console.log('LoggedIn Successfully!');
        res.status(200).send(sendLoginResponse);
    }catch(err){
        console.log('error while logging in');
        return res.status(500).json(err.message);
    }
});

module.exports=authRouter;

