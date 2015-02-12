var should = require('chai').should();
var request = require('supertest');
var async = require('async');
var _ = require('lodash');

request = request('http://localhost:3301');

var session = {
  authToken: null,
  userId: null,
  email: null,
  password: null
};

function loginAsUser(user) {
  describe('POST /api/users/login', function() {
    it('should login as user ' + user.email, function(done) {
      request
        .post('/api/users/login')
        .type('json')
        .send({email: user.email, password: user.password})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          res.body.should.have.property('ttl');
          res.body.should.have.property('userId');
          session.authToken = res.body.id;
          session.userId = res.body.userId;
          session.email = res.body.user.email;
          done();
        });
    });
  });
}

function createUser(emailOrUser, cb) {
  cb = cb || function(){};

  var newUser = emailOrUser;
  if(_.isString(emailOrUser)) {
    newUser = {
      email: emailOrUser,
      password: '123456789',
      first_name: 'Arthur',
      last_name: 'King',
      birthday: '1987-01-01',
      sex: 1,
      country: 'Russia',
      city: 'Saint-Petersburg'
    };
  }

  describe('API: createUser', function() {
    it('should create a new user ' + newUser.email, function(done) {
      request
        .post('/api/users')
        .type('json')
        .send(newUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          newUser.id = res.body.id;
          done();
          cb(newUser);
        });
    });
  });

  return newUser;
}

function loginAsNormalUser() {
  var user = {email:'user1@infloop.ru', password: '123456789'};
  loginAsUser(user);
}

function loginAsAdminUser() {
  var user = {email:'admin1@infloop.ru', password: '123456789'};
  loginAsUser(user);
}

function randomStr() {
  return Math.random().toString(36).substring(4);
}

function generateRandomUser() {
  return {
    email: 'user'+randomStr()+'@infloop.ru',
    password: '123456789'
  };
}

function createAndLoginAsNewNormalUser() {

  var newUser = {
    email: 'user_'+randomStr()+'@infloop.ru',
    password: '123456789',
    first_name: 'Arthur',
    last_name: 'King',
    birthday: '1987-01-01',
    sex: 1,
    country: 'Russia',
    city: 'Saint-Petersburg'
  };

  session.authToken = null;
  session.userId = null;
  describe('POST /api/users/', function () {
    it('should create a new user '+newUser.email, function (done) {
      async.series([
          function (cb) {
            request
              .post('/api/users/')
              .type('json')
              .send(newUser)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                res.body.should.have.property('id');
                cb();
              });
          },
          function (cb) {
            request
              .post('/api/users/login')
              .type('json')
              .send({email: newUser.email, password: newUser.password})
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                res.body.should.have.property('id');
                res.body.should.have.property('ttl');
                res.body.should.have.property('userId');
                session.authToken = res.body.id;
                session.userId = res.body.userId;
                session.email = res.body.user.email;
                cb();
              });
          }],
        done);
    });
  });
}

function createFriendship(friendship) {
  describe('API: createFriendship', function () {
    it('should create friendship between user '+friendship.user_id+' and user'+friendship.friend_id, function (done) {
      request
        .put('/api/users/'+friendship.user_id+'/friends/rel/'+friendship.friend_id)
        .set('Authorization', session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
}

function createMarker(marker) {
  describe('API: createMarker', function () {
    it('should create marker for user ' + session.userId, function (done) {
      request
        .post('/api/markers')
        .set('Authorization', session.authToken)
        .type('json')
        .send(marker)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          marker.id = res.body.id;
          done();
        });
    });
  });
}


function sendMessage(message) {
  describe('API: sendMessage', function () {
    var text = (message.recipient_id) ? (' to user ' + message.recipient_id) : (' to dialog ' + message.dialog_id) ;
    it('should send message from user '+session.userId+' to user' +message.recipient_id + text, function (done) {
      request
        .post('/api/messages')
        .set('Authorization', session.authToken)
        .type('json')
        .send(message)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('id');
          msgAtoB.id = res.body.id;
          res.body.should.have.property('dialog_id');
          res.body.should.have.property('sender_id').and.equal(session.userId);
          res.body.should.have.property('is_read').and.equal(false);
          res.body.should.have.property('created').and.have.length.above(6);
          res.body.should.have.property('updated').and.have.length.above(6);
          done();
        });
    });
  });
}

module.exports.session = session;
module.exports.randomStr = randomStr;
module.exports.createUser = createUser;
module.exports.loginAsUser = loginAsUser;
module.exports.sendMessage = sendMessage;
module.exports.createMarker = createMarker;
module.exports.createFriendship = createFriendship;
module.exports.generateRandomUser = generateRandomUser;
module.exports.createAndLoginAsNewNormalUser = createAndLoginAsNewNormalUser;
module.exports.loginAsAdminUser = loginAsAdminUser;
module.exports.loginAsNormalUser = loginAsNormalUser;
