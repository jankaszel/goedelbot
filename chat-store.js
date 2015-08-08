'use strict';

function ChatStore (client) {
  this.ids = [];
  this.client = client;

  this.client.get('ids', function (err, reply) {
    if (err)
      throw err;

    if (reply !== null) {
      try {
        data = JSON.parse(reply.toString());
          if (Array.isArray(data)) {
          this.ids = data;
          console.log('Restored state from redis (%s)',
            JSON.stringify(this.ids));
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
}

ChatStore.prototype = {
  push: function (id) {
    this.ids.push(id);
    this.sync();
  },

  remove: function (id) {
    var index = this.ids.indexOf(id);

    if (index > -1)
      ids.splice(index, 1);

    this.sync();
  },

  contains: function (id) {
    return this.ids.indexOf(id) !== -1;
  },

  forEach: function (callback) {
    return this.ids.forEach(callback);
  },

  sync: function () {
    this.client.set('ids', JSON.stringify(ids));
  }
};

module.exports = ChatStore;