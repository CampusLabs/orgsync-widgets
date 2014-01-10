import $ from 'jquery';
import Backbone from 'backbone';
import buildJson from 'text!build';
import elementQuery from 'elementQuery';
import jstz from 'jstz';
import moment from 'moment-timezone';
import momentTimezonesConfigJson from 'text!moment-timezone-config';

Backbone.$ = $;

moment.tz.add(JSON.parse(momentTimezonesConfigJson));

var defaults = {
  api: {cors: false},
  build: JSON.parse(buildJson),
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

$(window).on('ready resize load', function () { elementQuery(); });

export default defaults;
