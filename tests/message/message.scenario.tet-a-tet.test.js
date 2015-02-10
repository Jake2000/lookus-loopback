var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

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

  var userA = {
    email: 'user'+api.randomStr()+'@infloop.ru',
    password: '123456789'
  };

  var userB = {
    email: 'user'+api.randomStr()+'@infloop.ru',
    password: '123456789'
  };

  api.createUser(userA.email, function(user){
    userA = user;
  });

  api.createUser(userB.email, function(user){
    userB = user;
    msgAtoB.recipient_id = userB.id;
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
          msgAtoB.dialog_id = res.body.dialog_id;
          res.body.should.have.property('sender_id').and.equal(userA.id);
          res.body.should.have.property('recipient_id').and.equal(userB.id);
          res.body.should.have.property('is_read').and.equal(false);
          done();
        });
    });
  });

  api.loginAsUser(userB);

  describe('GET /api/users/{userB}/dialogs', function () {
    it('should list dialogs, with dialog created from message, sent by userA', function (done) {
      request
        .get('/api/users/'+userB.id+'/dialogs')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.contain.an.item.with.property('id', msgAtoB.dialog_id);
          res.body.should.contain.an.item.with.property('last_message');
          done();
        });
    });
  });

  describe('GET /dialogs/{dialog}', function () {
    it('should show dialog for userB', function (done) {
      request
        .get('/api/dialogs/'+msgAtoB.dialog_id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id').and.be.equal(msgAtoB.dialog_id);
          res.body.should.have.property('is_private').and.be.equal(true);
          res.body.should.have.property('is_grouped').and.be.equal(false);
          //res.body.should.have.property('unread_count').and.be.equal(1);
          res.body.should.have.property('last_message').and.be.not.equal(null);
          res.body.last_message.should.have.property('id').and.be.equal(msgAtoB.id);
          done();
        });
    });
  });


});
