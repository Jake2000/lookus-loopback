var debug = require('debug')('boot:extend-user-model');

module.exports = function(app) {
  //var PersistedModel = app.models.PersistedModel;
  //var find = Note.find;
  //var cache = {};


  //
  //Note.find = function(filter, cb) {
  //  var key = '';
  //  if(filter) {
  //    key = JSON.stringify(filter);
  //  }
  //  var cachedResults = cache[key];
  //  if(cachedResults) {
  //    console.log('serving from cache');
  //    process.nextTick(function() {
  //      cb(null, cachedResults);
  //    });
  //  } else {
  //    console.log('serving from db');
  //    find.call(Note, function(err, results) {
  //      if(!err) {
  //        cache[key] = results;
  //      }
  //      cb(err, results);
  //    });;
  //  }
  //}
};
