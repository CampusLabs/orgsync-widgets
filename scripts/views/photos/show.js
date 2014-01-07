//= require ../view.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var JST = window.JST;

  app.PhotosShowView = View.extend({
    template: JST['jst/photos/show'],

    events: {
      'click img': 'next',
    },

    options: ['action'],

    classes: [
      'orgsync-widget',
      'js-osw-photos-show',
      'osw-photos-show'
    ],

    toTemplate: function () {
      var model = this.model;
      return {
        image: model.get('full_url'),
        description: model.get('description'),
        url: model.orgsyncUrl()
      };
    },

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.comments = this.model.get('comments');
      this.comments.url = this.model.get('links').comments;
      this.comments.fetch();
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.views.commentsList = new app.InfiniteListView({
        el: this.$('.js-comments'),
        collection: this.comments,
        modelView: app.CommentsShowView,
        modelViewOptions: {tagName: 'li'}
      });
      return this;
    },

    next: function () {
      if (this.action === 'redirect') return;
      this.model.set('selected', false);
      var photos = this.model.collection;
      if (!photos) return;
      var i = (photos.indexOf(this.model) + 1) % photos.length;
      photos.at(i).set('selected', true);
    }
  });
})();
