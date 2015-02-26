var debug = require('debug')('boot:overrides');
var _ = require('lodash');
var async = require('async');

module.exports = function(app) {

  app.query = {};
  app.query.formatSearchQuery = function(fields, queryText, offset, limit, queryFields) {
    offset = offset | 0;
    limit = (limit | 0 || 50);

    var query = {offset: offset, limit: limit};

    if (fields) {
      fields = fields.split(',');
      query.fields = {};
      _.forEach(fields, function (fieldName) {
        query.fields[fieldName] = true;
      });
    }

    if (queryText && queryFields) {
      query.where = {};
      query.where.or = [];
      _.forEach(queryFields, function (fieldName) {
        var f = {};
        f[fieldName] = {like: queryText + '.+'};
        query.where.or.push();
      });

    }

    return query;
  };
};
