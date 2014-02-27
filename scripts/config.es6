import $ from 'jquery';
import Backbone from 'backbone';
import elementQuery from 'elementQuery';
import moment from 'moment-timezone';
import momentTimezoneData from 'moment-timezone-data';

Backbone.$ = $;

moment.tz.add(momentTimezoneData);

var defaults = {
  api: {cors: false},
  build: {include:['views/events/index']}
};

$(window).on('ready resize load', function () { elementQuery(); });

export default defaults;
