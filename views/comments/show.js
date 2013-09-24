//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;
  var moment = window.moment;

  app.CommentsShowView = View.extend({
    className: 'js-osw-comments-show osw-comments-show',

    template: jst['comments/show'],

    time: function () {
      return moment(this.model.get('created_at')).fromNow();
    }
  });
})();
