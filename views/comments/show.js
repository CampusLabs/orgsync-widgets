//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var JST = window.JST;

  app.CommentsShowView = View.extend({
    template: JST['jst/comments/show'],

    classes: [
      'orgsync-widget',
      'js-osw-comments-show',
      'osw-comments-show'
    ]
  });
})();
