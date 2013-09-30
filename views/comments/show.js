//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;

  app.CommentsShowView = View.extend({
    className: 'js-osw-comments-show osw-comments-show orgsync-widget',

    template: jst['comments/show']
  });
})();
