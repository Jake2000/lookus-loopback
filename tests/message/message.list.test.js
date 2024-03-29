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

  describe('GET /api/dialogs/{dialogId}/messages', function () {
    it('should include 2 msgs from userA and userB', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(2);
          res.body.should.contain.an.item.with.property('id', msgAB.id);
          res.body.should.contain.an.item.with.property('id', msgBA.id);
          done();
        });
    });
  });

  api.loginAsUser(userB);

  describe('GET /api/dialogs/{dialogId}/messages', function () {
    it('should include 2 msgs from userA and userB', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(2);
          res.body.should.contain.an.item.with.property('id', msgAB.id);
          res.body.should.contain.an.item.with.property('id', msgBA.id);
          done();
        });
    });
  });

});
