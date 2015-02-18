var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Subscription resource tests', function() {

  var subscriptionAB = {
    user_id: null,
    subscription_user_id: null
  };

  var subscriptionAC = {
    user_id: null,
    subscription_user_id: null
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();
  var userC = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    subscriptionAB.user_id = user.id;
    subscriptionAC.user_id = user.id;
  });

  api.createUser(userB.email, function(user) {
    userB.id = user.id;
    subscriptionAB.subscription_user_id = user.id;
  });

  api.createUser(userC.email, function(user) {
    userC.id = user.id;
    subscriptionAC.subscription_user_id = user.id;
  });

  api.loginAsUser(userA);

  api.createSubscription(subscriptionAB);

  api.createSubscription(subscriptionAC);

  describe('DELETE /api/users/{unauthorized}/subscriptions/rel/{subscription_user_id}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .del('/api/users/'+subscriptionAB.user_id+'/subscriptions/rel/'+subscriptionAB.subscription_user_id)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('DELETE /api/users/{userA}/subscriptions/rel/{subscription_user_id}', function () {
    it('should delete subscription to userB from userA subscriptions', function (done) {
      request
        .del('/api/users/'+subscriptionAB.user_id+'/subscriptions/rel/'+subscriptionAB.subscription_user_id)
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

  describe('DELETE /api/users/{userA}/subscriptions/rel/{subscription_user_id}', function () {
    it('should delete subscription to userC from userA subscriptions', function (done) {
      request
        .del('/api/users/'+subscriptionAC.user_id+'/subscriptions/rel/'+subscriptionAC.subscription_user_id)
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

  describe('GET /api/users/{userA}/subscriptions', function () {
    it('should list none subscriptions for userA', function (done) {
      request
        .get('/api/users/'+subscriptionAB.user_id+'/subscriptions')
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
