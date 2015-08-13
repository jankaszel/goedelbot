'use strict';

var TelegramBot = require('node-telegram-bot-api'),
  CronJob = require('cron').CronJob,
  fs = require('fs'),
  path = require('path'),
  redis = require('redis'),
  util = require('util');
  
var ChatStore = require('./chat-store'),
  MessageStore = require('./message-store'),
  ASEAG = require('./lib/aseag');

var seq = require('./seq.json');

var token = process.env.TOKEN,
  bot = new TelegramBot(token, { polling: true }),
  client = redis.createClient(6379, process.env.REDIS_HOST),
  jobs = [];

var chats = new ChatStore(client),
  motivations = new MessageStore({ client: client, key: 'motivation' }),
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
      console.log('Joined chat %d!', chatId);
    }
  }

  else if (msg.text === '/findegut') {
    bot.sendMessage(chatId, util.format('%s findet das gut! Gödel-approved!',
      msg.from.first_name));
  }

  else if (msg.text === '/schleichen') {
    if (!chats.contains(chatId)) {
      chats.push(chatId);
      console.log('Joined chat %d silently!', chatId);
    }

    bot.sendMessage(chatId, 'Pssscht!');
  }

  else if (msg.text === '/motivation') {
    motivations.pop(function (message) {
      bot.sendMessage(chatId, message);
    });
  }

  else if (msg.text === '/tip') {
    tips.pop(function (message) {
      bot.sendMessage(chatId, message);
    });
  }

  else if (msg.text === '/sequenzen') {
    bot.sendPhoto(chatId, 'images/seq-al.png', {
      caption: util.format('%s, hier sind die Schlussregeln in der AL! ' +
        'Alternativ /sequenzen_fo für die Schlussregeln in der FO.',
        msg.from.first_name)
    });
  }

  else if (msg.text === '/sequenzen_fo') {
    bot.sendPhoto(chatId, 'images/seq-fo.png', {
      caption: util.format('%s, hier sind die Schlussregeln in FO!',
        msg.from.first_name)
    });
  }

  else if (msg.text === '/kätzchen') {
    fs.readdir('images/kaetzchen', function (err, files) {
      if (err)
        throw err;
      
      var images = files.map(function (file) {
        return path.join('images/kaetzchen', file);
      }).filter(function (file) {
        return fs.statSync(file).isFile();
      }).filter(function (file) {
        return ['.png', '.jpg'].indexOf(path.extname(file)) !== -1;
      });

      var i = Math.floor(Math.random() * images.length);

      bot.sendPhoto(chatId, images[i]);
    });
  }

  else if (msg.text === '/bus') {
    var stops = {
      hainb: 100636,
      halifax: 100625
    }, busses = {
      '33': 33,
      '73': 73,
      '12': 12,
      '22': 22,
      '23': 100104
    }, destinations = {
      '33': ['Aachen Fuchserde'],
      '73': ['Aachen Bushof', 'Aachen Bf.Rothe Erde'],
      '12': ['Stolberg Mühlener Bf.', 'Donnerberg Höhenstraße', 'Buschmühle Friedhof'],
      '22': ['Stolberg Mühlener Bf.', 'Aachen Bushof'],
      '23': ['Hüls Schulzentrum', 'Aachen Elisenbrunnen', 'Hüls Gewerbegebiet']
    };
    
    var filter = [
      // 33, hainb
      function (entry) {
        return entry.stopId === stops.hainb &&
          entry.lineId === busses['33'] &&
          destinations['33'].indexOf(entry.directionName) !== -1;
      },

      // 73, hainb
      function (entry) {
        return entry.stopId === stops.hainb &&
          entry.lineId === busses['73'] &&
          destinations['73'].indexOf(entry.directionName) !== -1;
      },

      // 12, halifax
      function (entry) {
        return entry.stopId === stops.halifax &&
          entry.lineId === busses['12'] &&
          destinations['12'].indexOf(entry.directionName) !== -1;
      },

      // 22, halifax
      function (entry) {
        return entry.stopId === stops.halifax &&
          entry.lineId === busses['22'] &&
          destinations['22'].indexOf(entry.directionName) !== -1;
      },

      // 23, halifax
      function (entry) {
        return entry.stopId === stops.halifax &&
          entry.lineId === busses['23'] &&
          destinations['23'].indexOf(entry.directionName) !== -1;
      }
    ]

    ASEAG.call(filter, 5)
      .then(function (data) {
        var message = 'Logiker! Die nächsten Gefährte in Richtung Innenstadt ' +
          ' sind... \n\n';

        data.entries.forEach(function (entry) {
          var time = new Date(entry.estimatedTime);

          message = message + util.format(
            'Linie %d an %s um %d:%d in Richtung %s\n\n',
            entry.lineId, entry.stopName, time.getHours(), time.getMinutes(),
            entry.directionName);
        });

        bot.sendMessage(chatId, message);
      });
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
}, true, 'Europe/Berlin'));

process.on('exit', function () {
  console.log('Clearing up...');

  jobs.forEach(function (job) {
    job.stop();
  });

  chats.sync();
});