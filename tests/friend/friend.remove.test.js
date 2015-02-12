var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Friend resource tests', function() {

  var friendshipAB = {
    user_id: null,
    friend_id: null
  };

  var friendshipAC = {
    user_id: null,
    friend_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();
  var userC = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    friendshipAB.user_id = user.id;
    friendshipAC.user_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    friendshipAB.friend_id = user.id;
  });

  api.createUser(userC.email, function(user) {
    userC.id = user.id;
    friendshipAC.friend_id = user.id;
  });

  api.loginAsUser(userA);

  api.createFriendship(friendshipAB);

  api.createFriendship(friendshipAC);


});
