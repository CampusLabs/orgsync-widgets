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
    ],

    toTemplate: function () {
      var model = this.model;
      var creator = model.get('creator');
      return {
        avatar: creator.get('picture_url'),
        name: creator.get('display_name'),
        time: model.time(),
        content: model.get('content')
      };
    }
  });
})();
