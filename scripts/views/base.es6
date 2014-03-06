import _ from 'underscore';
import {View} from 'my-backbone';

export default View.extend({
  constructor: function () {
    this.views = {};
    View.apply(this, arguments);
    this.delegateListeners();
  },

  initialize: function (options) {
    if (this.options) {
      _.extend(this, _.pick.apply(_,
        [_.extend({}, this.$el.data(), options)]
          .concat(_.result(this, 'options'))
      ));
    }
    if (this.classes) this.$el.addClass(this.classes.join(' '));
  },

  render: function () {
    View.prototype.render.apply(this, arguments);
    if (this.template) {
      this.$el.html(this.template(_.result(this, 'toTemplate') || this));
    }
    return this;
  },

  delegateEvents: function () {
    View.prototype.delegateEvents.apply(this, arguments);
    _.invoke(this.views, 'delegateEvents');
    return this;
  },

  undelegateEvents: function () {
    View.prototype.undelegateEvents.apply(this, arguments);
    _.invoke(this.views, 'undelegateEvents');
    return this;
  },

  delegateListeners: function () {
    _.each(_.result(this, 'listeners'), function (events, key) {
      if (!this[key]) return;
      this.listenTo(this[key], _.reduce(events, function (events, key, ev) {
        events[ev] = this[key];
        return events;
      }, {}, this));
    }, this);
  },

  remove: function () {
    View.prototype.remove.apply(this, arguments);
    _.invoke(this.views, 'remove');
    return this;
  }
});
