var should = require('chai').should();
var request = require('supertest');
var async = require('async');

request = request('http://localhost:3301');

describe('Users resource tests', function() {

  var AuthToken = null;
  var UserId = null;

  describe('POST /api/users/login', function() {
    it('should work', function(done) {
        request
          .post('/api/users/login')
          .type('json')
          .send({email:'user1@infloop.ru', password: '123456789'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.property('id');
            res.body.should.have.property('ttl');
            res.body.should.have.property('userId');
            AuthToken = res.body.id;
            UserId = res.body.userId;
            done();
          });
    });
  });

});
