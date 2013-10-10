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
    return this;
  };
})();
