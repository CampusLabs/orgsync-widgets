(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = app.jQuery;

  var EventsIndexView = app.EventsIndexView;
  var render = EventsIndexView.prototype.render;

  EventsIndexView.prototype.render = function () {
    render.apply(this, arguments);
    this.$('.js-days-of-week .js-day')
      .wrap($('<div>').addClass('js-day-container'));
    this.$('.js-toggle-filters').addClass('icon-office-shortcuts');
    this.$('.js-today').addClass('icon-calendar');
    this.$('.js-prev-month').addClass('icon-pointer-left').text('');
    this.$('.js-next-month').addClass('icon-pointer-right').text('');
    return this;
  };
})();
