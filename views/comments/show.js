//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;

  app.CommentsShowView = View.extend({
    template: jst['comments/show'],

    classes: [
      'orgsync-widget',
      'js-osw-comments-show',
      'osw-comments-show'
    ]
  });
})();
