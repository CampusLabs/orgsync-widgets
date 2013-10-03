//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var jst = window.jst;
  var View = app.View;

  app.DaysShowView = View.extend({
    template: jst['days/show'],

    classes: [
      'orgsync-widget',
      'js-osw-days-show',
      'osw-days-show'
    ],

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderEventDatesList();
      return this;
    },

    renderEventDatesList: function () {
      this.views.eventDatesList = new app.ListView({
        el: this.$('.js-list'),
        collection: this.model.get('eventDates'),
        modelView: app.EventDatesShowView
      });
    }
  });
})();
