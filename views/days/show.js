//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var moment = window.moment;
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
    },

    date: function () {
      var date = this.model.date();
      var prefix = '';
      var today = moment().zone(this.model.get('zone')).startOf('day');
      if (date.isSame(today.subtract('day', 1))) prefix = 'Yesterday, ';
      if (date.isSame(today.add('day', 1))) prefix = 'Today, ';
      if (date.isSame(today.add('day', 1))) prefix = 'Tomorrow, ';
      return this.model.date().format('[' + prefix + ']dddd, MMMM D, YYYY');
    }
  });
})();
