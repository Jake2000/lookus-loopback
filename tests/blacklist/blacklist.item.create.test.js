var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Blacklist resource tests', function() {

  var blacklistItemAB = {
    user_id: null,
    blacklisted_user_id: null
  };

  var blacklistItemBA = {
    user_id: null,
    blacklisted_user_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    blacklistItemAB.user_id = user.id;
    blacklistItemBA.blacklisted_user_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    blacklistItemBA.user_id = user.id;
    blacklistItemAB.blacklisted_user_id = user.id;
  });

  describe('POST /api/users/{unauthorized}/blacklist/rel/{blacklisted_user_id}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .put('/api/users/'+blacklistItemAB.user_id+'/blacklist/rel/'+blacklistItemAB.blacklisted_user_id)
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

  describe('POST /api/users/{userA}/blacklist/rel/{userB}', function () {
    it('should add blacklisted userB to userA blacklist', function (done) {
      request
        .put('/api/users/'+blacklistItemAB.user_id+'/blacklist/rel/'+blacklistItemAB.blacklisted_user_id)
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

  api.loginAsUser(userB);

  describe('POST /api/users/{userB}/blacklist/rel/{userA}', function () {
    it('should add blacklisted userA to userB blacklist', function (done) {
      request
        .put('/api/users/'+blacklistItemBA.user_id+'/blacklist/rel/'+blacklistItemBA.blacklisted_user_id)
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
