var _ = require('lodash');
var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../tests/helpers/api.js');

request = request('http://localhost:3301');

var firstNames = [
  'John',
  'Vanessa',
  'Mike',
  'Lord',
  'Owen',
  'Kirill',
  'Hubble',
  'Ollie',
  'Julie',
  'Sacha',
  'Andrew',
  'Hugo',
  'Nitro'
];

var lastNames = [
  'Devlin',
  'Pemberton',
  'Green',
  'Brown',
  'Minogue',
  'Schmitter',
  'Bubble',
  'Lukodas',
  'Barbariskas',
  'Greenway',
  'Cash',
  'Boss',
  'Mitro'
];

var messageTexts = [
  ['How are you?', 'Fine']
];

var users = [];

var random = function(arr) {
  return _.sample(arr);
};

describe('Seeder', function() {

  describe('Creating users', function() {
    for(var i = 0; i < 300; i++) {
      var user = api.generateRandomUser(random(firstNames), random(lastNames), Math.round(Math.random()));
      api.createUser(user, function(newUser){
        user.id = newUser.id;
        users.push(user);
      });
    }
  });

});
