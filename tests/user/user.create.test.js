var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Users resource tests', function() {

  var AuthToken = null;
  var UserId = null;

  var user = {
    "email": 'user'+api.randomStr()+'@mail.com',
    "password": "123456789",
    "first_name": "Arthur",
    "last_name": "King",
    "birthday": "1987-01-01",
    "sex": 1,
    "country": "Russia",
    "city": "Saint-Petersburg"
  };

  describe('POST /api/users', function() {
    it('should work', function(done) {
      request
        .post('/api/users')
        .type('json')
        .send(user)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          AuthToken = res.body.id;
          UserId = res.body.userId;
          done();
        });
    });
  });

});
