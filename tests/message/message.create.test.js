var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message resource tests', function() {

  var msgAtoB = {
    body: 'test message.',
    subject: 'hello',
    recipient_id: 'objectid'
  };

  var msgAtoB_WhereIsReadTrue = {
    body: 'test message.',
    subject: 'hello',
    recipient_id: 'objectid',
    is_read: true
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  describe('POST /api/messages', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .post('/api/messages')
        .type('json')
        .send(msgAtoB)
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
    msgAtoB.recipient_id = userB.id;
    msgAtoB_WhereIsReadTrue.recipient_id = userB.id;
  });

  api.loginAsUser(userA);

  describe('POST /api/messages', function () {
    it('should send message (from userA to userB)', function (done) {
      request
        .post('/api/messages')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(msgAtoB)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          msgAtoB.id = res.body.id;
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(userA.id);
          res.body.should.have.property('recipient_id').and.equal(userB.id);
          res.body.should.have.property('is_read').and.equal(false);
          res.body.should.have.property('created').and.match(api.timezoneRegExp());
          res.body.should.have.property('updated').and.match(api.timezoneRegExp());
          done();
        });
    });
  });

  describe('POST /api/messages', function () {
    it('should send bad message (from userA to userB) and be unread', function (done) {
      request
        .post('/api/messages')
        .set('Authorization', api.session.authToken)
        .type('json')
        .send(msgAtoB_WhereIsReadTrue)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(userA.id);
          res.body.should.have.property('recipient_id').and.equal(userB.id);
          res.body.should.have.property('is_read').and.equal(false);
          res.body.should.have.property('created').and.match(api.timezoneRegExp());
          res.body.should.have.property('updated').and.match(api.timezoneRegExp());
          done();
        });
    });
  });



});
