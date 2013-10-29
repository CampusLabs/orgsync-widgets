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

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      var date = this.model.date().clone();
      this.$el.addClass(
        'js-day-' + this.model.id + ' js-month-' + date.format('YYYY-MM')
      );
      this.eventDates = this.model.get('eventDates');
      var today = moment().tz(date.tz()).startOf('day');
      if (date.isSame(today)) this.$el.addClass('js-today');
      if (date.startOf('week').isSame(today.startOf('week'))) {
        this.$el.addClass('js-current-week');
      }
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderEventDatesList();
      return this;
    },

    renderEventDatesList: function () {
      this.views.eventDatesList = new app.ListView({
        el: this.$('.js-list'),
        collection: this.eventDates,
        modelView: app.EventDatesShowView,
        modelViewOptions: {day: this.model}
      });
    },

    longDate: function () {
      var date = this.model.date();
      var today = moment().tz(date.tz()).startOf('day');
      var prefix = (function () {
        switch (+date) {
        case +today.subtract('day', 1):
          return 'Yesterday, ';
        case +today.add('day', 1):
          return 'Today, ';
        case +today.add('day', 1):
          return 'Tomorrow, ';
        }
        return '';
      })();
      return date.format('[' + prefix + ']dddd, MMMM D, YYYY');
    },

    shortDate: function () {
      var date = this.model.date();
      return (date.date() === 1 ? date.format('MMMM') + ' ' : '') + date.date();
    }
  });
})();
