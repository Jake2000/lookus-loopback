var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Subscription resource tests', function() {

  var subscriptionAB = {
    user_id: null,
    subscription_user_id: null
  };

  var subscriptionBA = {
    user_id: null,
    subscription_user_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    subscriptionAB.user_id = user.id;
    subscriptionBA.subscription_user_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    subscriptionBA.user_id = user.id;
    subscriptionAB.subscription_user_id = user.id;
  });

  describe('POST /api/users/{unauthorized}/subscriptions/rel/{subscription_user_id}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .put('/api/users/'+subscriptionAB.user_id+'/subscriptions/rel/'+subscriptionAB.subscription_user_id)
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

  describe('POST /api/users/{userA}/subscriptions/rel/{userB}', function () {
    it('should create add userB subscription for userA', function (done) {
      request
        .put('/api/users/'+subscriptionAB.user_id+'/subscriptions/rel/'+subscriptionAB.subscription_user_id)
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

  describe('POST /api/users/{userB}/friends/rel/{userA}', function () {
    it('should create add userA subscription for userB', function (done) {
      request
        .put('/api/users/'+subscriptionBA.user_id+'/subscriptions/rel/'+subscriptionBA.subscription_user_id)
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
