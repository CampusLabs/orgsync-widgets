(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventDatesShowView = app.EventDatesShowView;
  var initialize = EventDatesShowView.prototype.initialize;

  EventDatesShowView.prototype.initialize = function () {
    initialize.apply(this, arguments);
    var event = this.model.get('event');
    this.$el.css({borderLeftColor: '#' + event.hex()});
    if (this.continues || this.continued || event.get('is_all_day')) {
      this.$el.css({background: '#' + event.hex(0.9)});
    }
  };
})();
