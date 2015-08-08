'use strict';

// http://stackoverflow.com/a/6274398
function permute (list) {
  var counter = list.length, temp, index;

  while (counter > 0) {
    index = Math.floor(Math.random() * counter--);

    temp = list[counter];
    list[counter] = list[index];
    list[index] = temp;
  }

  return list;
}

module.exports = permute;