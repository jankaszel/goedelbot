/* Requires the ReturnList to be in the format of
 * StopPointName,StopID,LineName,DestinationName
 */

var IVU = {
  parse: function (body) {
    var lines = body.split(/\r?\n/),
      lines = lines.map(JSON.parse),
      ret = {};

    var first = lines.shift();
    ret.version = first[1];

    ret.entries = lines.map(function (line) {
      var entry = {
        stopName: line[1],
        stopId: parseInt(line[2]),
        lineId: parseInt(line[3]),
        directionName: line[4],
        estimatedTime: parseInt(line[5])
      };

      return entry;
    });

    return ret;
  }
}

module.exports = IVU;