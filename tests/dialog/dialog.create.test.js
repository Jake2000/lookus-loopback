var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Dialog resource tests', function() {

  var privateDialog = {
    title: 'new test dialog, created by '
  };

  var userA = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    privateDialog.title += '' + user.email;
  });

  describe('POST /api/users/{unauthorized}/dialogs', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .post('/api/users/'+userA.id+'/dialogs')
        .type('json')
        .send(privateDialog)
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

  describe('POST /api/users/{userA}/dialogs', function () {
    it('should create a new private group dialog for userA', function (done) {
      request
        .post('/api/users/'+userA.id+'/dialogs')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(privateDialog)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('is_private').and.be.equal(true);
          res.body.should.have.property('is_grouped').and.be.equal(true);
          done();
        });
    });
  });

});
