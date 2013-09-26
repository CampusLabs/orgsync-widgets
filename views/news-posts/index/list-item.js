//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var moment = window.moment;
  var Olay = window.Olay;
  var View = app.View;

  app.NewsPostsIndexListItemView = View.extend({
    tagName: 'li',

    className: 'js-list-item list-item',

    template: window.jst['news-posts/index/list-item'],

    events: {
      click: 'show'
    },

    options: ['action'],

    show: function (ev) {
      if (this.action === 'redirect') return;
      ev.preventDefault();
      var newsPost = this.model;
      if (!this.olay) {
        (this.views.newsPostsShow = new app.NewsPostsShowView({
          model: newsPost,
          action: this.action
        })).render();
        (this.olay = new Olay(this.views.photosShow.$el, {preserve: true}))
          .$container.addClass('osw-news-post-show-olay');
      }
      this.olay.show();
    },

    time: function () {
      return moment(this.model.get('created_at')).fromNow();
    },

    remove: function () {
      if (this.olay) this.olay.destroy();
      return View.prototype.remove.apply(this, arguments);
    }
  });
})();
