(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventDatesShowView = app.EventDatesShowView;
  var correctDisplay = EventDatesShowView.prototype.correctDisplay;
  var tinycolor = app.tinycolor;

  EventDatesShowView.prototype.listeners.eventFilters = {
    'change:enabled': 'correctDisplay'
  };

  EventDatesShowView.prototype.correctDisplay = function () {
    correctDisplay.apply(this, arguments);
    var event = this.model.get('event');
    this.$el.css({borderLeftColor: this.color().toHexString()});
    if (this.view !== 'list' &&
        (this.continues || this.continued || event.get('is_all_day'))
      ) {
      this.$el.css(
        'background',
        tinycolor.lighten(this.color(), 40).toHexString()
      );
    }
  };
})();
