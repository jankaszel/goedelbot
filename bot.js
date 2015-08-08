'use strict';

var TelegramBot = require('node-telegram-bot-api'),
  CronJob = require('cron').CronJob,
  redis = require('redis'),
  ChatStore = require('./chat-store'),
  MessageStore = require('./message-store');

var seq = require('./seq.json');

var token = process.env.TOKEN,
  bot = new TelegramBot(token, { polling: true }),
  client = redis.createClient(6379, process.env.REDIS_HOST),
  job = [],

var chats = new ChatStore(client),
  motivations = new MessageStore({ client: client, key: 'motivational' }),
  tips = new MessageStore({ client: client, key: 'tip' });

bot.getMe().then(function (me) {
  console.log('Hi, my name is %s. I\'m a bot!',
    me.first_name);
});

bot.on('message', function (msg) {
  var chatId = msg.chat.id;

  if (msg.text === '/start') {
    if (chats.contains(chatId)) {
      bot.sendMessage(chatId, '1 + 1 = 1!');
    }

    else {
      bot.sendMessage(chatId, 'Guten Tag, edle Logiker! Ich bin Kurt Gödel, ' +
        'und werde Ihren Lerntag um logische Fakten bereichern.');
      chats.push(chatId);
    }
  }

  else if (msg.text === '/schleichen') {
    if (!chats.contains(chatId)) {
      chats.push(chatId);
      console.log('Silent start');
    }

    bot.sendMessage(chatId, 'Pssscht!');
  }

  else if (msg.text === '/motivation') {
    bot.sendMessage(chatId, motivations.pop());
  }

  else if (msg.text === '/tip') {
    bot.sendMessage(chatId, tips.pop());
  }
});

jobs.push(new CronJob('00 30 08 * * *', function () {
  console.log('Digest job called');

  chats.forEach(function (chatId) {
    bot.sendMessage(chatId, 'O, welch schöner Tag! Edle Logiker, begebt Euch' +
      ' in die Lernräume, um der Logik zu fröhnen!');
  })
}, true, 'Europe/Berlin'));

jobs.push(new CronJob('00 00 12 * * *', function () {
}, true, 'Europe/Berlin'));

jobs.push(new CronJob('00 00 18 * * *', function () {
  chats.forEach(function (chatId) {
    bot.sendMessage(chatId, 'Edle Logiker, Ihr wart fleißig! Den Feierabend ' +
      'habt ihr Euch redlich verdient.\n\nNicht! There\'s always more!');
  });
}));

process.on('exit', function () {
  console.log('Clearing up...');

  jobs.forEach(function (job) {
    job.stop();
  });

  chats.sync();
});