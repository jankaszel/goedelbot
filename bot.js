var TelegramBot = require('node-telegram-bot-api'),
  CronJob = require('cron').CronJob;

var token = process.env.TOKEN,
  bot = new TelegramBot(token, { polling: true }),
  job = null;

var chats = [];

bot.getMe().then(function (me) {
  console.log('Hi, my name is %s!', me.username);
});

bot.on('message', function (msg) {
  var chatId = msg.chat.id;

  console.log('onMessage: ', msg.text);

  if (msg.text === '/start') {
    if (chats.indexOf(chatId) !== -1) {
      bot.sendMessage(chatId, '1 + 1 = 1!');
    }

    else {
      bot.sendMessage(chatId, 'Guten Tag, edle Logiker! Ich bin Kurt Gödel, und werde Ihren Lerntag um logische Fakten bereichern.');
      chats.push(chatId);
    }
  }

  else if (msg.text === '/digest') {
    bot.sendMessage(chatId, 'O, welch schöner Tag! Edle Logiker, begebt Euch in die Lernräume, um der Logik fröhnen!');
  }
});

job = new CronJob('00 00 09 * * *', function () {
  chats.forEach(function (chatId) {
    bot.sendMessage(chatId, 'O, welch schöner Tag! Edle Logiker, begebt Euch in die Lernräume, um der Logik fröhnen!');
  })
})

job.start();
console.log('Digest job started.');

process.on('exit', function () {
  job.stop();
});