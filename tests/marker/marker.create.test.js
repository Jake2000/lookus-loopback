var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Marker resource tests', function() {

  var marker = {
    life_time: 100,
    "type": 2,
    text: "new marker for user ",
    is_up: false,
    location: {
      lat: 36.99,
      lng: 25.45
    }
  };

  var userA = {
    email: 'user'+api.randomStr()+'@infloop.ru',
    password: '123456789'
  };

  describe('POST /api/markers', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .post('/api/markers')
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.createUser(userA.email, function(user) {
    marker.text += '' + user.email;
  });

  api.loginAsUser(userA);

  describe('POST /api/markers', function () {
    it('should work (for userA)', function (done) {
      request
        .post('/api/markers')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('is_up').and.equal(false);
          done();
        });
    });
  });

  describe('POST /api/markers', function () {
    it('should block creating two markers (for userA)', function (done) {
      request
        .post('/api/markers')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.loginAsAdminUser();

  describe('POST /api/markers', function () {
    it('should create marker (as admin user)', function (done) {
      marker.text = 'Marker for admin';
      request
        .post('/api/markers')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('is_up').and.equal(false);
          done();
        });
    });
  });

  describe('POST /api/markers', function () {
    it('should create second marker (as admin user)', function (done) {
      marker.text = 'Second marker for admin';
      request
        .post('/api/markers')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('is_up').and.equal(false);
          done();
        });
    });
  });
});
