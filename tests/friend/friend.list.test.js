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

  describe('PUT /api/users/{userA}/friends/rel/{userB}', function () {
    it('should create add userB friend for userA', function (done) {
      request
        .put('/api/users/'+friendshipAB.user_id+'/friends/rel/'+friendshipAB.friend_id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('PUT /api/users/{userA}/friends/rel/{userC}', function () {
    it('should create add userC friend for userA', function (done) {
      request
        .put('/api/users/'+friendshipAC.user_id+'/friends/rel/'+friendshipAC.friend_id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('GET /api/users/{userA}/friends', function () {
    it('should list friends for userA, including userB and userC', function (done) {
      request
        .get('/api/users/'+friendshipAB.user_id+'/friends')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(2);
          res.body.should.contain.an.item.with.property('id', friendshipAB.friend_id);
          res.body.should.contain.an.item.with.property('id', friendshipAC.friend_id);
          done();
        });
    });
  });

});
