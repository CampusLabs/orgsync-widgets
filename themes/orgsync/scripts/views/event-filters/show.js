(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventFiltersShowView = app.EventFiltersShowView;
  var render = EventFiltersShowView.prototype.render;

  EventFiltersShowView.prototype.render = function () {
    render.apply(this, arguments);
    this.$el.prepend(app.$('<span>')
      .addClass('js-icon icon-portal')
      .css({color: '#' + this.model.hex()})
    );
  };
})();
