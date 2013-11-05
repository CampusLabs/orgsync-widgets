(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventFiltersShowView = app.EventFiltersShowView;
  var initialize = EventFiltersShowView.prototype.initialize;

  EventFiltersShowView.prototype.initialize = function () {
    initialize.apply(this, arguments);
    this.$el.css({borderLeftColor: '#' + this.model.hex()});
    this.$el.css({background: '#' + this.model.hex(0.9)});
  };
})();
