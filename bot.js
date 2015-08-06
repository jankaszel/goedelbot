var TelegramBot = require('node-telegram-bot-api'),
  CronJob = require('cron').CronJob,
  redis = require('redis');

var token = process.env.TOKEN,
  bot = new TelegramBot(token, { polling: true }),
  client = redis.createClient(6379, 'chipmonkey'),
  job = null,
  chats = [];

client.get('chats', function (err, reply) {
  if (err)
    throw err;

  if (reply !== null) {
    try {
      data = JSON.parse(reply.toString());
      
      if (Arrays.isArray(data)) {
        chats = data;
        console.log('Restored state from redis (%s)',
          JSON.stringify(chats));
      }
    }

    catch (e) {
      console.warn('Warning: Couldn\'t restore state from redis.');
    }
  }

  else {
    console.log('No restorable state found')
  }
});

function sync () {
  client.set('chats', JSON.stringify(chats));
}

bot.getMe().then(function (me) {
  console.log('Hi, my name is %s %s. I\'m a bot!',
    me.first_name, me.last_name);
});

bot.on('message', function (msg) {
  var chatId = msg.chat.id;

  if (msg.text === '/start') {
    if (chats.indexOf(chatId) !== -1) {
      bot.sendMessage(chatId, '1 + 1 = 1!');
    }

    else {
      bot.sendMessage(chatId, 'Guten Tag, edle Logiker! Ich bin Kurt Gödel, ' +
        'und werde Ihren Lerntag um logische Fakten bereichern.');
      chats.push(chatId);
      sync();
    }
  }

  else if (msg.text === '/startsilent') {
    if (chats.indexOf(chatId) === -1) {
      chats.push(chatId);
      sync();

      console.log('Silent start');
    }
  }

  else if (msg.text === '/hallo') {
    bot.sendMessage(chatId, 'O, welch schöner Tag! Edle Logiker, begebt Euch ' +
      'in die Lernräume, um der Logik zu fröhnen!');
  }

  else if (msg.text === '/tschuess') {
    var index = chats.indexOf(chatId);
    if (index > -1) {
      chats.splice(index, 1);
      sync();

      bot.sendMessage(chatId, 'Logik steckt überall! Mich werdet Ihr niemals los!');
    }
  }
});

job = new CronJob('00 00 10 * * *', function () {
  console.log('Digest job called');

  chats.forEach(function (chatId) {
    bot.sendMessage(chatId, 'O, welch schöner Tag! Edle Logiker, begebt Euch' +
      ' in die Lernräume, um der Logik zu fröhnen!');
  })
}, true, 'Europe/Berlin')
console.log('Digest job started.');

process.on('exit', function () {
  job.stop();
  sync();
});