require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');
const Admin = require('./src/models/adminModel');
const User = require('./src/models/userModel');
const UserAuthDetails = require('./src/models/userAuthDetails')
const sessionDetails = require("./src/models/sessionDetailsModel");
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 8000;
const ejs = require('ejs');
const telegramBot = require('./telegramBot')
const BOT_TOKEN = '7561209044:AAHsnGtIz8Be-WfXrbIEowL7HAs8g230ZVY'
const axios = require('axios')
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken')
//set webhook to enable commm with server and bot
const setWebhook = async () => {                                              //82.112.236.150:8000
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://e5cc-27-6-213-111.ngrok-free.app/bot`;
  try {
    await axios.get(url);
    console.log('Webhook set successfully');
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
};

app.use(cors({
  origin: 'http://localhost:5000' // Replace with the actual origin of your React app
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});


// login initiated (user clicks "login w telegram" button), API returns a uniqueID to track the user auth status
app.post('/auth/telegram' , async (req, res) => {
  requestId = uuidv4();
  const userAuth = new UserAuthDetails({requestId, isAuthenticated: false, userId: '' });
  await userAuth.save();
  res.json({reqId: requestId})
})

//client calls the api to check authentication status of the user
app.get('/auth/telegram/status/:requestId', async (req, res) => {
  const  {requestId}  = req.params;
  console.log(requestId)

  const userAuth = await UserAuthDetails.findOne({ requestId });
  if (userAuth && userAuth.isAuthenticated) {
    const token = jwt.sign({ userId: userAuth.userId },`JWT_SECRET`,{ expiresIn: '1h' } );
    return res.json({ status: true, token });
  } else {
    return res.status(401).json({ status: false, message: 'User is not authenticated' });
  }
});

app.get('/user/:id', (req, res) => {
  const id = req.params.id;
  const user = Admin.findOne({telegramId:id}).then((user) => {
    if(user){
      res.render('index', { user: user });
    }else{
      res.send("User not found");
      // res.render('index', { user: null });
    }
  })
});


app.get('/style.css', (req, res) => {
  console.log("d");
  res.sendFile(__dirname + '\/views/style.css');
});
app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '\/views/script.js');
});
//send request to routes
app.use('/bot', telegramBot)
app.use('/admin', adminRoutes);
app.use('/userinfo', userRoutes);
app.post("/save-session-details", async (req, res) => {
  try {
    const userDetails = new sessionDetails(req.body);
    await userDetails.save();
    res.status(200).send("User details saved successfully!");
  } catch (error) {
    res.status(500).send("Error saving user details: " + error.message);
  }
});
app.get('/users',async (req, res) =>{
  try {
    const users = await Admin.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})
app.get('/users/:id',async (req, res) =>{
  const id = req.params.id;
  try {
    const users = await Admin.findOne({telegramId:id});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(PORT, async () => {
   console.log(`Server running on port ${PORT}`)
   await setWebhook()
})








// const TelegramBot = require('node-telegram-bot-api');
// const token = '7416078699:AAGk5OuX341sFtgWOBySiCw3p0-4ZRDnIoA';
// const bot = new TelegramBot(token, { polling: true });

// // Simple command to start the bot
// bot.onText(/\/start/, (msg) => {
//   //searching DB for user ID
//   var userID = msg.from.id + msg.from.first_name+msg.from.last_name;
//   User.findOne({userId:userID}).then((user) => {
//     console.log(user);
//     if(user){
//       bot.sendMessage(msg.chat.id, `Welcome ${user.firstname}!`);
//       bot.sendMessage(msg.chat.id, 'Verifing user').then((msg) => {
//         bot.deleteMessage(msg.chat.id, msg.message_id);
//       } );
//       const url = `http://127.0.0.1:5000/`+user.telegramId;
//       const options = {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: 'Go to Website',
//                 url: url  // Replace with your desired URL
//               }
//             ]
//           ]
//         }
//       };
//       setTimeout(() => {
//         bot.sendMessage(msg.chat.id, 'Click the button below to visit our website.', options);
//       }, 2000);
//       // bot.sendMessage(msg.chat.id, 'Welcome! Click the button below to visit our website.', options);
//     }else{
//       bot.sendMessage(msg.chat.id, `You are not Register!`);

//       bot.sendMessage(msg.chat.id, 'Do you want to register?', {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: 'Yes',
//                 callback_data: 'yes'
//               },
//               {
//                 text: 'No',
//                 callback_data: 'no'
//               }
//             ]
//           ]
//         }
//       });

//       bot.on('callback_query', (callbackQuery) => {
//         const data = callbackQuery.data;
//         if (data === 'yes') {

//             bot.sendMessage(msg.chat.id, 'Please send your contact by pressing your contact', {
//               reply_markup: {
//                 keyboard: [
//                   [
//                     {
//                       text: "📲 Shere phone number",
//                       request_contact: true,
//                     },
//                   ],
//                 ],
//               },
//             });

//             bot.on('contact', (msg) => {
//               console.log(msg);
//               bot.sendMessage(msg.chat.id, `Your contact has been received!`,{
//                 reply_markup: {
//                   remove_keyboard: true,
//                   force_reply: false,
//                 }
//               });
//               bot.sendMessage(msg.chat.id, `Welcome ${msg.contact.first_name}! your verification is in process..`);

//               bot.deleteMessage(msg.chat.id, msg.message_id);


//             });





//             bot.sendMessage(msg.chat.id, 'Please send your contact by pressing your contact');
//             const url = `http://127.0.0.1:5000/`+user.telegramId;
//             const options = {
//               reply_markup: {
//                 inline_keyboard: [
//                   [
//                     {
//                       text: 'Go to Website',
//                       url: url  // Replace with your desired URL
//                     }
//                   ]
//                 ]
//               }
//             };
//             setTimeout(() => {
//               bot.sendMessage(msg.chat.id, 'Click the button below to visit our website.', options);
//             }, 2000);


//         } else {
//           bot.sendMessage(msg.chat.id, 'Thank you for your time!');
//         }

//       });
//     }
//   }).catch((err) => {
//     console.log(err);
//   });
// });