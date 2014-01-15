import $ from 'jquery';
import elementQuery from 'elementQuery';
import Olay from 'olay';
import herit from 'herit';

export default herit(Olay, {
  constructor: function (el, options, className) {
    Olay.apply(this, arguments);
    this.$container.addClass('orgsync-widget').addClass(className + '-olay');
    this.$el.append($('<div>').addClass('js-olay-hide icon-delete'));
    console.log(this.$el.children());
  },

  show: function () {
    Olay.prototype.show.apply(this, arguments);
    elementQuery();
    console.log(this.$el.children());
    return this;
  }
});
