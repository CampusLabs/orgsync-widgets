import elementQuery from 'elementQuery';
import Olay from 'olay';
import herit from 'herit';

export default herit(Olay, {
  constructor: function (el, options, className) {
    Olay.apply(this, arguments);
    this.$container.addClass('orgsync-widget').addClass(className + '-olay');
  },

  show: function () {
    Olay.prototype.show.apply(this, arguments);
    elementQuery();
    return this;
  }
});
