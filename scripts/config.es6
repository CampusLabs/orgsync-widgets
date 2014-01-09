import $ from 'jquery';
import Backbone from 'backbone';
import buildJson from 'text!build';
import elementQuery from 'elementQuery';
import moment from 'moment-timezone';
import momentTimezonesConfigJson from 'text!moment-timezone-config';

Backbone.$ = $;

moment.tz.add(JSON.parse(momentTimezonesConfigJson));

var defaults = {
  api: {cors: false},
  build: JSON.parse(buildJson)
};

$(window).on('ready resize load', function () { elementQuery(); });

export default defaults;
