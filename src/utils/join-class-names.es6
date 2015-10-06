import _ from 'underscore';

export default function (a, b) {
  return _.compact(_.unique(
    (a || '').split(/\s+/).concat((b || '').split(/\s+/))
  )).join(' ');
}
