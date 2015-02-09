var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message resource tests', function() {

  var message = {
    body: 'test message.',
    subject: 'hello',
    recipient_id: 'objectid'
  };
  var userA = {
    email: 'user'+api.randomStr()+'@infloop.ru',
    password: '123456789'
  };
  var userB = {
    email: 'user'+api.randomStr()+'@infloop.ru',
    password: '123456789'
  };

  describe('POST /api/messages', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .post('/api/messages')
        .type('json')
        .send(message)
        .set('Authorization', '')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.createUser(userA.email, function(user){
    userA = user;
  });

  api.createUser(userB.email, function(user){
    userB = user;
    message.recipient_id = userB.id;
  });

  api.loginAsUser(userA);

  describe('POST /api/messages', function () {
    it('should send message (from userA to userB)', function (done) {
      request
        .post('/api/messages')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(message)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(userA.id);
          res.body.should.have.property('recipient_id').and.equal(userB.id);
          done();
        });
    });
  });
});
