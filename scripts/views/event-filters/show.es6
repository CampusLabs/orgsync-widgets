import _ from 'underscore';
import BaseView from 'views/base';
import EventFiltersShow from 'jst/event-filters/show';

var iconMap = {
  organization: 'organization',
  service_partner: 'service',
  umbrella: 'umbrella',
  service_umbrella: 'service',
  featured: 'promote',
  rsvp: 'check'
};

export default BaseView.extend({
  tagName: 'div',

  template: EventFiltersShow,

  classes: [
    'orgsync-widget',
    'js-osw-event-filters-show',
    'osw-event-filters-show'
  ],

  options: ['legendMode', 'header'],

  events: {
    'change .js-enabled': 'setEnabled',
    'change .js-all-enabled': 'setAllEnabled'
  },

  listeners: {
    model: {
      'change:color': 'updateColor',
      'change:enabled': 'updateEnabled'
    },
    collection: {'change:enabled': 'updateAllEnabled'}
  },

  toTemplate: function () {
    var type = this.model.get('type');
    return {
      name: this.model.get('name'),
      iconName: iconMap[type],
      isFirst: this.model === this.collection.first(),
      header: this.header
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

  setEnabled: function () {
    this.model.set(
      'enabled',
      this.legendMode || this.$('.js-enabled').prop('checked')
    );
  },

  updateEnabled: function () {
    this.$('.js-enabled').prop('checked', this.model.get('enabled'));
  },

  setAllEnabled: function () {
    var enabled = this.legendMode || this.$('.js-all-enabled').prop('checked');
    _.invoke(this.collection.slice(1), 'set', 'enabled', enabled);
  },

  updateAllEnabled: function () {
    if (this.model !== this.collection.first()) return;
    var enabled = this.collection.at(1).get('enabled');
    var indeterminate = this.collection.any(function (filter) {
      return filter !== this.model && filter.get('enabled') !== enabled;
    }, this);
    this.$('.js-all-enabled').prop({
      indeterminate: indeterminate,
      checked: indeterminate || enabled
    });
  },

  updateColor: function () {
    this.$('.js-icon').css({color: this.model.color().toHexString()});
  }
});
