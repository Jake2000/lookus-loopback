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

function createUser(email, cb) {
  cb = cb || function(){};

  var newUser = {
    email: email,
    password: '123456789',
    first_name: 'Arthur',
    last_name: 'King',
    birthday: '1987-01-01',
    sex: 1,
    country: 'Russia',
    city: 'Saint-Petersburg'
  };

  describe('POST /api/users', function() {
    it('should create a new user '+email, function(done) {
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

module.exports.session = session;
module.exports.randomStr = randomStr;
module.exports.createUser = createUser;
module.exports.loginAsUser = loginAsUser;
module.exports.createAndLoginAsNewNormalUser = createAndLoginAsNewNormalUser;
module.exports.loginAsAdminUser = loginAsAdminUser;
module.exports.loginAsNormalUser = loginAsNormalUser;
