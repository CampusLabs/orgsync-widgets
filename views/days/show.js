//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var moment = window.moment;
  var jst = window.jst;
  var View = app.View;

  app.DaysShowView = View.extend({
    template: jst['days/show'],

    listeners: {
      eventDates: {'add remove': 'checkEmpty'}
    },

    classes: [
      'orgsync-widget',
      'js-osw-days-show',
      'osw-days-show'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.eventDates = this.model.get('eventDates');
      var date = this.model.date().clone();
      var today = moment().tz(date.tz()).startOf('day');
      if (+date === +today) this.$el.addClass('js-today');
      if (+date.startOf('week') === +today.startOf('week')) {
        this.$el.addClass('js-this-week');
      }
      this.checkEmpty();
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

    checkEmpty: function () {
      this.$el.toggleClass('js-empty', !this.eventDates.length);
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
      return (date.date() === 1 ? date.format('MMM') + ' ' : '') + date.date();
    }
  });
})();
