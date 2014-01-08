import moment from 'moment-timezone';
import timezones from 'text!moment-timezone.json';

moment.tz.add(JSON.parse(timezones));

var defaults = {
  api: {cors: false}
};

export default = defaults;
