'use strict';

var permute = require('./permute');

function MessageStore (options) {
  this.client = options.client;
  this.key = options.key;
  this.messages = [];
}

MessageStore.prototype = {
  pop: function (callback) {
    if (typeof callback !== 'function')
      throw 'MessageStore.pop: callback is not type of function';

    if (this.messages.length === 0) {
      this.client.get(this.key, function (err, val) {
        if (err)
          throw err;

        var data = JSON.parse(val);
        if (Array.isArray(data)) {
          this.messages = permute(data);
        }

        else
          throw 'MessageStore.pop: corrupted redis data for key ' + this.key;
      })
    }

    else {
      callback(this.messages.pop());
    }
  }
};

module.exports = MessageStore;