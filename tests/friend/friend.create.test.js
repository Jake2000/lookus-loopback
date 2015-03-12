var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Friend resource tests', function() {

  var friendshipAB = {
    user_id: null,
    friend_id: null
  };

  var friendshipBA = {
    user_id: null,
    friend_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    friendshipAB.user_id = user.id;
    friendshipBA.friend_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    friendshipBA.user_id = user.id;
    friendshipAB.friend_id = user.id;
  });

  describe('POST /api/users/{unauthorized}/friends/rel/{friend_id}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .put('/api/users/'+friendshipAB.user_id+'/friends/rel/'+friendshipAB.friend_id)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.loginAsUser(userA);

  describe('POST /api/users/{userA}/friends/rel/{userB}', function () {
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

  describe('GET /api/users/{userA}', function () {
    it('should have increased friends_count after creating a friend for userA', function (done) {
      request
        .get('/api/users/'+userA.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('friends_count').and.be.equal(1);
          done();
        });
    });
  });

  api.loginAsUser(userB);

  describe('POST /api/users/{userB}/friends/rel/{userA}', function () {
    it('should create add userA friend for userB', function (done) {
      request
        .put('/api/users/'+friendshipBA.user_id+'/friends/rel/'+friendshipBA.friend_id)
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

});
