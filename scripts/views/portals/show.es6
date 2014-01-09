import _ from 'underscore';
import BaseView from 'views/base';
import PortalsShowTemplate from 'jst/portals/show/index';
import PortalsShowLoadingTemplate from 'jst/portals/show/loading';
import PortalsShowErrorTemplate from 'jst/portals/show/error';

export default BaseView.extend({
  className: 'js-osw-portals-show osw-portals-show',

  template: PortalsShowTemplate,

  loadingTemplate: PortalsShowLoadingTemplate,

  errorTemplate: PortalsShowErrorTemplate,

  events: {
    'click .js-try-again': 'fetch'
  },

  classes: [
    'orgsync-widget',
    'js-osw-portals-show',
    'osw-portals-show'
  ],

  render: function () {
    if (this.model.get('description') !== void 0) {
      return BaseView.prototype.render.apply(this, arguments);
    }
    return this.fetch();
  },

  fetch: function () {
    this.renderLoading();
    this.model.fetch({
      success: _.bind(this.render, this),
      error: _.bind(this.renderError, this)
    });
    return this;
  },

  renderLoading: function () {
    this.$el.html(this.loadingTemplate(this));
  },

  renderError: function () {
    this.$el.html(this.errorTemplate(this));
  }
});
