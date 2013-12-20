(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventDatesListItemView = app.EventDatesListItemView;
  var correctDisplay = EventDatesListItemView.prototype.correctDisplay;
  var tinycolor = app.tinycolor;

  EventDatesListItemView.prototype.listeners.eventFilters = {
    'change:enabled': 'correctDisplay'
  };

  EventDatesListItemView.prototype.correctDisplay = function () {
    correctDisplay.apply(this, arguments);
    var event = this.model.get('event');
    this.$el.css({borderLeftColor: this.color().toHexString()});
    if (this.view !== 'list' &&
        (this.continues || this.continued || event.get('is_all_day'))
      ) {
      this.$el.css(
        'background',
        tinycolor.lighten(this.color(), 45).toHexString()
      );
    }
  };
})();
