const express = require('express');
const router = express.Router();
const axios = require('axios')
const User = require('./src/models/userModel')
const UserAuthDetails = require('./src/models/userAuthDetails')
const jwt = require('jsonwebtoken');
const BOT_TOKEN = '7561209044:AAHsnGtIz8Be-WfXrbIEowL7HAs8g230ZVY'
const TelegramBot = require('node-telegram-bot-api');




router.post('/', async (req, res) => {
  let token = ''
  console.log(req.body)
  const { message } = req.body;
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text;
    console.log(text)
    const requestId = text.split(' ')[1] 
    if(text.startsWith('/start') ){
      const user = await User.findOne({ telegramId: chatId });
      const userId = message.from.id + message.from.first_name + message.from_lastname;
      //add user if doesnt exist already
      if (!user) {
        const newUser = new User({userId: userId, firstname: message.from.first_name, lastname: message.from.last_name, telegramId:message.from.id, userType: message.chat.type });
        await newUser.save();
      }
      //updating auth status of the user in UserAuthDetails
      const userAuth = await UserAuthDetails.findOneAndUpdate({ requestId },
        {
          isAuthenticated: true,
          userId: message.from.id,
        },
        { new: true }
      );

      const responseText = `Login Completed, you can visit the site. `;
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${message.chat.id}&text=${encodeURIComponent(responseText)}&parse_mode=Markdown`;
      try {
        await axios.get(url);
      }catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }
  res.sendStatus(200)
});
// Listen for /start command

module.exports = router
