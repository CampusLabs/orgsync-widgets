import $ from 'jquery';
import Backbone from 'backbone';
import elementQuery from 'elementQuery';
import jstz from 'jstz';
import moment from 'moment-timezone';
import momentTimezoneData from 'moment-timezone-data';

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

moment.tz.add(momentTimezoneData);

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', function () { elementQuery(); });

export default config;
