var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('User settings resource tests', function() {

  var settings = {
    push_notifications_enable: true,
    push_notifications_only_from_friends: true,
    app_sound_enabled: true
  };

  var userA = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
  });

  describe('PUT /api/users/{unauthorized}/settings', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .put('/api/users/'+userA.id+'/settings')
        .type('json')
        .send(settings)
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

  describe('PUT /api/users/{userA}/settings', function () {
    it('should work for userA', function (done) {
      request
        .put('/api/users/'+userA.id+'/settings')
        .type('json')
        .send(settings)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('push_notifications_enable').and.equals(true);
          res.body.should.have.property('push_notifications_only_from_friends').and.equals(true);
          res.body.should.have.property('app_sound_enabled').and.equals(true);
          done();
        });
    });
  });

  describe('GET /api/users/{userA}/settings', function () {
    it('should work for userA (checking settings are set)', function (done) {
      request
        .get('/api/users/'+userA.id+'/settings')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('push_notifications_enable').and.equals(true);
          res.body.should.have.property('push_notifications_only_from_friends').and.equals(true);
          res.body.should.have.property('app_sound_enabled').and.equals(true);
          done();
        });
    });
  });
});
