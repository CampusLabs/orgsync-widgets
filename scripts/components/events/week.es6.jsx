/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import Column from 'components/events/column';
import mom from 'mom';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getEventsForDay: function (n) {
    var startMom = mom(this.props.start, this.state.tz).day(n);
    var start = startMom.toISOString();
    var startDate = startMom.format('YYYY-MM-DD');
    var endMom = startMom.add('day', 1);
    var end = endMom.toISOString();
    var endDate = endMom.format('YYYY-MM-DD');
    return _.filter(this.state.events, function (event) {
      var startComp = event.is_all_day ? startDate : start;
      var endComp = event.is_all_day ? endDate : end;
      return event.ends_at > startComp && event.starts_at < endComp;
    });
  },

  isCurrentDay: function (n) {
    var tz = this.state.tz;
    var day = mom(this.props.start, tz).day(n);
    var now = mom(void 0, tz);
    return day.isSame(now, 'day');
  },

  renderHeader: function (n) {
    var day = mom(this.props.start, this.state.tz).day(n);
    var formatted = day.format(day.date() === 1 ? 'MMMM D' : 'D');
    return (
      <th key={n} className={this.isCurrentDay(n) ? 'osw-current-day' : null}>
        <div className='osw-day-wrapper'>{formatted}</div>
      </th>
    );
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
    var events = this.getEventsForDay(n);
    var remaining = _.difference(events, added);
    var dayDiff = 1;
    var first = remaining[0];
    var firstI = -1;
    var startMom = mom(this.props.start, tz).day(n);
    if (first && (row < this.props.rows - 1 || remaining.length === 1)) {
      firstI = _.indexOf(this.state.events, first);
      added.push(first);
      var firstEndsAtMom = mom(first.ends_at, tz);
      dayDiff = Math.ceil(firstEndsAtMom.diff(startMom, 'days', true));
    }
    var colSpan = Math.min(7 - n, dayDiff);
    var cols = [];
    var hideTitle = false;
    if (colSpan > 1 && !first.is_all_day) {
      cols.push(
        <Column
          key={n}
          colSpan={1}
          first={startMom.format('YYYY-MM-DD')}
          cursors={{
            event: this.getCursor('events', firstI),
            tz: this.getCursor('tz')
          }}
        />
      );
      ++n;
      --colSpan;
      startMom.add('days', 1);
      hideTitle = true;
    }
    return cols.concat(
      <Column
        key={n}
        colSpan={colSpan}
        remaining={remaining.length}
        first={startMom.format('YYYY-MM-DD')}
        hideTitle={hideTitle}
        cursors={{
          event: this.getCursor('events', firstI),
          tz: this.getCursor('tz')
        }}
      />,
      this.renderColumn(n + colSpan, added, row)
    );
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
      <table className='osw-events-week'>
        {this.renderHead()}
        {this.renderBody()}
      </table>
    );
  }
});
