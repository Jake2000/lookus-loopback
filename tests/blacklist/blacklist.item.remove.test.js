var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Blacklist resource tests', function() {

  var blacklistItemAB = {
    user_id: null,
    blacklisted_user_id: null
  };

  var blacklistItemAC = {
    user_id: null,
    blacklisted_user_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();
  var userC = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    blacklistItemAB.user_id = user.id;
    blacklistItemAC.user_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    blacklistItemAB.blacklisted_user_id = user.id;
  });

  api.createUser(userC.email, function(user) {
    userC.id = user.id;
    blacklistItemAC.blacklisted_user_id = user.id;
  });

  api.loginAsUser(userA);

  api.createBlacklistItem(blacklistItemAB);

  api.createBlacklistItem(blacklistItemAC);

  describe('DELETE /api/users/{unauthorized}/blacklist/rel/{blacklisted_user_id}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .del('/api/users/'+blacklistItemAB.user_id+'/blacklist/rel/'+blacklistItemAB.blacklisted_user_id)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('DELETE /api/users/{userA}/blacklist/rel/{blacklisted_user_id}', function () {
    it('should delete blacklisted userB from userA blacklist', function (done) {
      request
        .del('/api/users/'+blacklistItemAB.user_id+'/blacklist/rel/'+blacklistItemAB.blacklisted_user_id)
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

  describe('DELETE /api/users/{userA}/blacklist/rel/{blacklisted_user_id}', function () {
    it('should delete blacklisted userC from userA blacklist', function (done) {
      request
        .del('/api/users/'+blacklistItemAC.user_id+'/blacklist/rel/'+blacklistItemAC.blacklisted_user_id)
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

  describe('GET /api/users/{userA}/blacklist', function () {
    it('should empty blacklist for userA', function (done) {
      request
        .get('/api/users/'+blacklistItemAB.user_id+'/blacklist')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(0);
          done();
        });
    });
  });

});
