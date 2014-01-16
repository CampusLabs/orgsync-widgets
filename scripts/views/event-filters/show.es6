import BaseView from 'views/base';
import EventFiltersShow from 'jst/event-filters/show';

var iconMap = {
  organization: 'organization',
  service_organization: 'service',
  umbrella: 'umbrella',
  service_umbrella: 'service',
  featured: 'promote',
};

export default BaseView.extend({
  tagName: 'label',

  template: EventFiltersShow,

  classes: [
    'orgsync-widget',
    'js-osw-event-filters-show',
    'osw-event-filters-show'
  ],

  options: ['legendMode'],

  events: {
    'change .js-enabled': 'updateEnabled'
  },

  listeners: {
    model: {'change:color': 'updateColor'}
  },

  toTemplate: function () {
    return {
      name: this.model.get('name'),
      iconName: iconMap[this.model.get('type')]
    };
  },

  initialize: function () {
    BaseView.prototype.initialize.apply(this, arguments);
    if (this.legendMode) this.$el.addClass('js-legend-mode');
  },

  render: function () {
    BaseView.prototype.render.apply(this, arguments);
    this.updateColor();
    return this;
  },

  updateEnabled: function () {
    this.model.set(
      'enabled',
      this.legendMode || this.$('.js-enabled').prop('checked')
    );
  },

  updateColor: function () {
    this.$('.js-icon').css({color: this.model.color().toHexString()});
  }
});
