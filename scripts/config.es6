import $ from 'jquery';
import Backbone from 'backbone';
import elementQuery from 'elementQuery';
import jstz from 'jstz';
import moment from 'moment-timezone';
import momentTimezonesJson from 'text!moment-timezone.json';

var config = {
  api: {cors: false},
  tz: jstz.determine().name(),
  elementQuery: {
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
  }
};

Backbone.$ = $;

moment.tz.add(JSON.parse(momentTimezonesJson));

// Fixing the updateOffset method for some wonky DST issues.
moment.updateOffset = function (date) {
  if (!date._z) return;
  var delta = date.zone();
  var offset = date._z.offset(date);
  if (!(delta -= offset)) return;
  date.zone(offset);
  if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
};

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', function () { elementQuery(); });



export default config;
