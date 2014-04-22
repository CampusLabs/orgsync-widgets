import _ from 'underscore';
import api from 'api';
import Backbone from 'backbone-pristine';
import module from 'module';

var methodMap = {
  create: 'post',
  read: 'get',
  update: 'put',
  delete: 'delete',
  patch: 'patch'
};

Backbone.sync = function (method, model, options) {
  var url = _.result(model, 'url');
  var data = options.data;
  model.requestCount == null ? model.requestCount = 1 : model.requestCount++;
  model.trigger('request:start');
  return api[methodMap[method]](url, data, function (er, res) {
    model.requestCount--;
    model.trigger('request:end');
    if (er || (er = res.error)) return options.error(er);
    options.success(res.data);
  });
};

// This is for compat with current-gen AMD.
module.exports = Backbone;

// In the future it will be...
// export default Backbone;
