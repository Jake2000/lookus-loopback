var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message resource tests', function() {

  var msgAB = {
    body: 'test message.',
    subject: 'hello',
    recipient_id: 'objectid'
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user){
    userA = user;
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

  describe('DELETE /api/dialogs/{dialogId}/messages/{id}', function () {
    it('should delete message by userA', function (done) {
      request
        .del('/api/dialogs/'+msgAB.dialog_id+'/messages/'+msgAB.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(204)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('GET /api/dialogs/{dialogId}/messages', function () {
    it('should not include deleted msg from userA', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(0);
          res.body.should.not.contain.an.item.with.property('id', msgAB.id);
          done();
        });
    });
  });

  api.loginAsUser(userB);

  describe('GET /api/dialogs/{dialogId}/messages', function () {
    it('should include msg from userA for userB', function (done) {
      request
        .get('/api/dialogs/'+msgAB.dialog_id+'/messages')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(1);
          res.body.should.contain.an.item.with.property('id', msgAB.id);
          done();
        });
    });
  });

});
