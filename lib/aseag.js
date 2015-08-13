var q = require('q'),
  request = require('request'),
  IVU = require('./ivu-parser');

var ASEAG = {
  call: function (filters, n) {
    var deferred = q.defer();

    request('http://ivu.aseag.de/interfaces/ura/instant_V1?' +
      'ReturnList=StopPointName,StopID,LineID,DestinationName,EstimatedTime',
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var data = IVU.parse(body);

          var entries = data.entries,
            matched = [];

          filters.forEach(function (filter) {
            var filtered = entries.filter(filter);
            console.log(filtered);

            matched = matched.concat(filtered);
          });

          matched = matched.sort(function (a, b) {
            return a.estimatedTime < b.estimatedTime ? -1 : 1;
          })

          data.entries = matched.slice(0, n);
          deferred.resolve(data);
        }

        else {
          deferred.reject(true);
        }
      }
    );

    return deferred.promise;
  },
}

module.exports = ASEAG;