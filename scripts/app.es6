import $ from 'jquery';
import _ from 'underscore';
import config from 'config';
import dpr from 'dpr';
import elementQuery from 'elementQuery';
import herit from 'herit';
import jstz from 'jstz';
import moment from 'moment';
import Olay from 'olay';
import OrgSyncApi from 'orgsync-javascript-api';

// requestAnimationFrame shim.
_.each(['webkit', 'moz'], function (vendor) {
  if (window.requestAnimationFrame) return;
  window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
  window.cancelAnimationFrame =
    window[vendor + 'CancelAnimationFrame'] ||
    window[vendor + 'CancelRequestAnimationFrame'];
});
if (!window.requestAnimationFrame) {
  var lastTime = 0;
  window.requestAnimationFrame = function (cb) {
    var now = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (now - lastTime));
    var id = window.setTimeout(_.partial(cb, now + timeToCall), timeToCall);
    lastTime = now + timeToCall;
    return id;
  };
  window.cancelAnimationFrame = clearTimeout;
}

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery({
  '.orgsync-widget': {
    'min-width': [
      '231px',
      '251px',
      '401px',
      '461px',
      '480px',
      '501px',
      '640px',
      '691px',
      '751px',
      '800px',
      '921px',
      '960px',
      '1001px'
    ]
  }
});

// Fixing the updateOffset method for some wonky DST issues.
moment.updateOffset = function (date) {
  if (!date._z) return;
  var delta = date.zone();
  var offset = date._z.offset(date);
  if (!(delta -= offset)) return;
  date.zone(offset);
  if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
};

// Views will add themselves to this map with their corresponding selectors.
// i.e. {'.js-osw-index-portals': app.IndexPortalsView}
var selectorViewMap = {};

var scan = function () {
  $('html').addClass('dpr-' + dpr());
  _.each(selectorViewMap, function (view, selector) {
    $(selector).each(function () { new view({el: this}); });
  });
  elementQuery();
};

$(scan);

var OriginalOlay = Olay;

export {selectorViewMap, scan};
export var api = new OrgSyncApi(config.api);
export var Olay = herit(OriginalOlay, {
  constructor: function () {
    OriginalOlay.apply(this, arguments);
    this.$content.addClass('orgsync-widget');
  }
});
export var tz = jstz.determine().name();

// Require each widget designated in the build.
_.each(config.build.include, require);
