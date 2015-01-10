module.exports = function(Dialog) {
  Dialog.disableRemoteMethod('create', true);
  Dialog.disableRemoteMethod('update', true);
  Dialog.disableRemoteMethod('updateOne', true);
  Dialog.disableRemoteMethod('deleteById', true);
  Dialog.disableRemoteMethod('deleteOne', true);
  Dialog.disableRemoteMethod('updateAll', true);
  Dialog.disableRemoteMethod('exists', true);
  Dialog.disableRemoteMethod('findOne', true);
  Dialog.disableRemoteMethod('count', true);
  Dialog.disableRemoteMethod('upsert', true);
  //Dialog.disableRemoteMethod('find', true);

  //var find = Dialog.find;
  //Dialog.find = function(filter, cb) {
  //  filter.where =
  //  find.call(Dialog, filterfunction(err, results) {
  //    if(!err) {
  //      cache[key] = results;
  //    }
  //    cb(err, results);
  //  });
  //};
};
