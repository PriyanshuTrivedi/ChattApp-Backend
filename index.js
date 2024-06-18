const express=require('express');
const http=require('http');
const Socket=require('socket.io');
const cors=require('cors');
require("dotenv").config();

const dbConnection=require('./db');

const authRouter=require('./controllers/authController');
const msgRouter=require('./controllers/msgController');

const app=express();
const server=http.createServer(app);
const SocketServer=Socket.Server;

dbConnection();

const backendPort=5000;
const frontend=`http://localhost:3000`;

// middlewares 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes 
app.use('/auth',authRouter);
app.use('/msg',msgRouter);

const io=new SocketServer(server,{
    cors:{
        origin:frontend,
        methods:['GET','POST','PUT','DELETE']
    }
});

server.listen(backendPort,()=>{
    console.log(`backend is running on port ${backendPort}`);
});

app.get('/',(req,res)=>{
    res.send('Basic chatBox backend...');
})

io.on('connection',(socket)=>{
    console.log('user connected with id-> '+socket.id);
    socket.on('join_room',(room)=>{
        console.log('joined room with id-> '+room);
        socket.join(room);
        socket.on('send_msg',(data)=>{
            console.log('snd_data me y milra->'+data);
            socket.to(room).emit('receive_msg',data);
        });
    })
    
    socket.on('disconnect', ()=> {
      console.log('user disconnected');
    });
});
