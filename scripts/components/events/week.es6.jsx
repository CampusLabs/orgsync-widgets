/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import Column from 'components/events/column';
import moment from 'moment-timezone';
import React from 'react/addons';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-events-week'];
    var a = moment.tz(this.props.start, this.state.tz);
    var b = moment.tz(this.state.tz).startOf('week');
    if (a.isSame(b)) classes.push('osw-current-week');
    return classes.join(' ');
  },

  getEventsForDay: function (events, n) {
    var startMom = moment.tz(this.props.start, this.state.tz).day(n);
    var start = startMom.toISOString();
    var startDate = startMom.format('YYYY-MM-DD');
    var endMom = startMom.clone().add('day', 1);
    var end = endMom.toISOString();
    var endDate = endMom.format('YYYY-MM-DD');
    return _.filter(this.state.events, function (event) {
      var startComp = event.is_all_day ? startDate : start;
      var endComp = event.is_all_day ? endDate : end;
      return event.ends_at > startComp &&
        event.starts_at < endComp &&
        (n === 0 || event.starts_at >= startComp);
    });
  },

  renderHeader: function (n) {
    var day = moment.tz(this.props.start, this.state.tz).day(n);
    var formatted = day.format(day.date() === 1 ? 'MMMM D' : 'D');
    return <th key={n}><div className='osw-wrapper'>{formatted}</div></th>;
  },

  renderHead: function () {
    return <thead><tr>{_.times(7, this.renderHeader)}</tr></thead>;
  },

  renderEvent: function (event) {
    return event.title;
  },

  renderColumn: function (n, added, row) {
    if (n >= 7) return [];
    var tz = this.state.tz;
    var events = this.getEventsForDay(events, n);
    var remaining = _.difference(events, added);
    var dayDiff = 1;
    var first = remaining[0];
    var firstI = -1;
    if ((row < this.props.rows - 1 || remaining.length < 2) && first) {
      firstI = _.indexOf(this.state.events, first);
      added.push(first);
      var startMom = moment.tz(this.props.start, tz).day(n);
      var firstEndsAtMom =
        first.is_all_day ?
        moment.tz(first.ends_at, this.state.tz) :
        moment(first.ends_at);
      dayDiff = Math.ceil(firstEndsAtMom.diff(startMom, 'days', true));
    }
    var colSpan = Math.min(7 - n, dayDiff);
    return [
      <Column
        key={n}
        colSpan={colSpan}
        remaining={remaining.length && remaining}
        cursors={{
          event: this.getCursor('events', firstI),
          tz: this.getCursor('tz')
        }}
      />
    ].concat(this.renderColumn(n + colSpan, added, row));
  },

  renderRow: function (added, n) {
    return <tr key={n}>{this.renderColumn(0, added, n)}</tr>;
  },

  renderBody: function () {
    return (
      <tbody>{_.times(this.props.rows, _.partial(this.renderRow, []))}</tbody>
    );
  },

  render: function () {
    return (
      <table className={this.getClassName()}>
        {this.renderHead()}
        {this.renderBody()}
      </table>
    );
  }
});
