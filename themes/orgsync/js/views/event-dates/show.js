(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventDatesShowView = app.EventDatesShowView;
  var initialize = EventDatesShowView.prototype.initialize;

  EventDatesShowView.prototype.initialize = function () {
    initialize.apply(this, arguments);
    this.$el.css({borderLeftColor: this.model.get('event').hex()});
    if (this.continues || this.continued || this.event.get('is_all_day')) {
      this.$el.css({background: this.model.get('event').hex(0.8)});
    }
  };
})();
