import {Olay} from 'app';
import View from 'views/view';
import PortalsShowView from 'views/portals/show';

export default = View.extend({
  tagName: 'li',

  className: 'js-list-item list-item',

  template: window.JST['jst/portals/index/list-item'],

  events: {
    'click': 'open'
  },

  listeners: {
    model: {remove: 'checkRemove'}
  },

  options: ['action'],

  open: function (ev) {
    if (this.action === 'redirect') return;
    ev.preventDefault();
    if (!this.olay) {
      this.views.show = new PortalsShowView({model: this.model});
      this.olay = new Olay(this.views.show.render().$el);
    }
    this.olay.show();
  },

  checkRemove: function (portal, collection) {
    if (collection === this.collection) this.remove();
  }
});
