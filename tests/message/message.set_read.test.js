var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message resource tests', function() {


});
