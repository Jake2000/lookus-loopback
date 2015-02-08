var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Users resource tests', function() {

  describe('GET /api/current', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .get('/api/users/current')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.loginAsNormalUser();

  describe('GET /api/users/current', function () {
    it('should work for normal user', function (done) {
      request
        .get('/api/users/current')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id').and.equal(api.session.userId);
          done();
        });
    });
  });

  api.loginAsAdminUser();

  describe('GET /api/users/current', function () {
    it('should work for admin user', function (done) {
      request
        .get('/api/users/current')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id').and.equal(api.session.userId);
          done();
        });
    });
  });
});
