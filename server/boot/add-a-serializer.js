var _ = require('lodash');

module.exports = function(app) {
  var PersistedModel = app.loopback.PersistedModel;

  /**
   *
   * @param {String} modelName
   * @param {*} object
   * @returns {{type: string, subtype: string, entities: string, json: string}}
   */
  app.serialize = function (modelName, object) {
    var details = {type: '', subtype: '', entities: '', json: ''};

    if (object instanceof PersistedModel) {
      details.type = 'PersistedModel';
      details.subtype = modelName;
      details.json = JSON.stringify(object.toJSON());
    } else if (object instanceof Array) {
      details.type = 'Array';
      details.subtype = modelName;
      //TODO implement
    } else {
      details.type = 'Object';
      details.subtype = '';
      details.json = JSON.stringify(object);
    }
    return details;
  };

  /**
   *
   * @param {string} type
   * @param {string} subtype
   * @param {string} entities
   * @param {string} json
   * @returns {*}
   */
  app.deserialize = function (type, subtype, entities, json) {
    var object = null;

    if (_.isNull(json) || _.isUndefined(json) || json == 'null') {
      return null;
    }

    if (_.isNull(entities) || _.isUndefined(entities) || entities == 'null') {
      return null;
    }

    var parsedJson = null;
    try {
      parsedJson = JSON.parse(json);
    } catch (e) {
      return null;
    }

    if (type == 'PersistedModel') {
      var modelProto = app.models[subtype];
      object = new modelProto(parsedJson);
    } else if (type == 'Array') {
      //TODO implement
    } else {
      object = parsedJson;
    }

    return object;
  }
};
