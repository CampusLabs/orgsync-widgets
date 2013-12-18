(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var EventFiltersShowView = app.EventFiltersShowView;
  var render = EventFiltersShowView.prototype.render;

  var iconMap = {
    organization: 'organization',
    service_organization: 'service',
    umbrella: 'umbrella',
    service_umbrella: 'service',
    featured: 'promote',
  };

  EventFiltersShowView.prototype.listeners = {
    model: {'change:color': 'updateColor'}
  };

  EventFiltersShowView.prototype.render = function () {
    render.apply(this, arguments);
    this.$el.prepend(app.$('<span>')
      .addClass('js-icon icon-' + iconMap[this.model.get('type')])
    );
  };

  EventFiltersShowView.prototype.updateColor = function () {
    this.$('.js-icon').css({color: this.model.color().toHexString()});
  };
})();
