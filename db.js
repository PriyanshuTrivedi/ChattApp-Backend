const mongoose=require('mongoose');
require('dotenv').config()

const dbConnection=async()=>{
    const URL=process.env.MONGO_URL;
    try{
        await mongoose.connect(URL,{});
        console.log('Database connected successfully!');
    }catch(err){
        console.log('Database connection failed, error: ');
        console.log(err);
    }
}

module.exports=dbConnection;