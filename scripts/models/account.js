//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var Account = app.Account = Model.extend({});

  Account.Collection = Model.Collection.extend({
    model: Account
  });
})();
