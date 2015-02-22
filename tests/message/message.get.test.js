var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message resource tests', function() {

  var msgAB = {
    body: 'test message AB',
    subject: 'hello',
    recipient_id: 'objectid'
  };

  var msgBA = {
    body: 'test message BA',
    subject: 'hello',
    recipient_id: 'objectid'
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user){
    userA = user;
    msgBA.recipient_id = userA.id;
  });

  api.createUser(userB.email, function(user){
    userB = user;
    msgAB.recipient_id = userB.id;
  });

  api.loginAsUser(userA);

  api.sendMessage(msgAB, function(message) {
    msgAB.id = message.id;
    msgAB.dialog_id = message.dialog_id;
  });

  api.loginAsUser(userB);

  api.sendMessage(msgBA, function(message) {
    msgBA.id = message.id;
    msgBA.dialog_id = message.dialog_id;
  });

  api.loginAsUser(userA);

  describe('GET /api/dialogs/{dialogId}/messages/{msgAB}', function () {
    it('should get message from userA to userB', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages/' + msgAB.id)
        .set('Authorization', api.session.authToken)
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

  describe('GET /api/dialogs/{dialogId}/messages/{msgBA}', function () {
    it('should get message from userB to userA', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages/' + msgBA.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(userB.id);
          res.body.should.have.property('recipient_id').and.equal(userA.id);
          res.body.should.have.property('is_read').and.equal(false);
          res.body.should.have.property('created').and.match(api.timezoneRegExp());
          res.body.should.have.property('updated').and.match(api.timezoneRegExp());
          done();
        });
    });
  });

  api.loginAsUser(userB);

  describe('GET /api/dialogs/{dialogId}/messages/{msgAB}', function () {
    it('should get message from userA to userB', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages/' + msgAB.id)
        .set('Authorization', api.session.authToken)
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

  describe('GET /api/dialogs/{dialogId}/messages/{msgBA}', function () {
    it('should get message from userB to userA', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages/' + msgBA.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(userB.id);
          res.body.should.have.property('recipient_id').and.equal(userA.id);
          res.body.should.have.property('is_read').and.equal(false);
          res.body.should.have.property('created').and.match(api.timezoneRegExp());
          res.body.should.have.property('updated').and.match(api.timezoneRegExp());
          done();
        });
    });
  });

});
