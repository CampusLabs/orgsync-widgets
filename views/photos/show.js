//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;

  app.PhotosShowView = View.extend({
    className: 'js-osw-photos-show osw-photos-show',

    template: jst['photos/show'],

    events: {
      'click img': 'next',
    },

    options: ['action'],

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
