module.exports = function(app) {
  app.remotes().findMethod('marker.create').notes = "" +
  'При создании маркера автоматически создается диалог.<br>';

  app.remotes().findMethod('marker.create').accepts = [{arg: 'data', type: 'markerModelEditable', http: {source: 'body'}}];
};
