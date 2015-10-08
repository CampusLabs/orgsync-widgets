import moment from '../node_modules/moment-timezone/moment-timezone';
import data from '../node_modules/moment-timezone/data/packed/latest';

moment.tz.load(data);

export default moment;
