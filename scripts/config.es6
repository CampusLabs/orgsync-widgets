import $ from 'jquery';
import Backbone from 'backbone';
import buildJson from 'text!build';
import moment from 'moment-timezone';
import momentTimezonesConfigJson from 'text!moment-timezone-config';

Backbone.$ = $;

moment.tz.add(JSON.parse(momentTimezonesConfigJson));

var defaults = {
  api: {cors: false},
  build: JSON.parse(buildJson)
};

export default defaults;
