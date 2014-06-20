import module from 'module';
import moment from 'moment-timezone-pristine';
import momentTimezoneData from 'moment-timezone-data';

moment.tz.add(momentTimezoneData);

// Fixing the updateOffset method for some wonky DST issues.
// moment.updateOffset = function (date) {
//   if (!date._z) return;
//   var delta = date.zone();
//   var offset = date._z.offset(date);
//   if (!(delta -= offset)) return;
//   date.zone(offset);
//   if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
// };

// This is for compat with current-gen AMD.
module.exports = moment;

// In the future it will be...
// export default moment;
