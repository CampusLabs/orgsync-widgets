import $ from 'jquery';
import Backbone from 'backbone';
import elementQuery from 'elementQuery';
import moment from 'moment-timezone';
import momentTimezoneData from 'moment-timezone-data';

Backbone.$ = $;

moment.tz.add(momentTimezoneData);

// Fixing the updateOffset method for some wonky DST issues.
moment.updateOffset = function (date) {
  if (!date._z) return;
  var delta = date.zone();
  var offset = date._z.offset(date);
  if (!(delta -= offset)) return;
  date.zone(offset);
  if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
};

var defaults = {
  api: {cors: false},
  build: {include: ['views/portals/index/index', 'views/events/index']}
};

$(window).on('ready resize load', function () { elementQuery(); });

export default defaults;
