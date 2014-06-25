/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import Column from 'components/events/column';
import {mom, getDaySpan} from 'entities/event';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getEventsForDate: function (date) {
    var dateMom = mom(date, this.state.tz);
    var iso = dateMom.toISOString();
    dateMom.add('day', 1);
    var endIso = dateMom.toISOString();
    var endDate = dateMom.format('YYYY-MM-DD');
    return _.filter(this.state.events, function (event) {
      var start = event.is_all_day ? date : iso;
      var end = event.is_all_day ? endDate : endIso;
      return event.ends_at > start && event.starts_at < end;
    });
  },

  getGrid: function () {
    var rows = this.props.rows;
    var added = [];
    var tz = this.state.tz;
    var grid = _.times(rows, _.partial(_.times, 7, _.constant(null)));
    _.times(7, function (x) {
      var dateMom = mom(this.props.date, tz).day(x);
      var iso = dateMom.toISOString();
      var date = dateMom.format('YYYY-MM-DD');

      // Find events for this day, then remove the events that have already been
      // added previously in the grid.
      var events = _.difference(this.getEventsForDate(date), added);
      _.times(rows, function (y) {
        var i;
        if (!events.length) return;

        // Show the more message.
        if (y === rows - 1 && events.length > 1) {
          var prev = grid[y][x];
          grid[y][x] = {more: events.length};

          // This is tricky. If a previous event was overlapping what will be
          // our more message, it is necessary to move backward and change the
          // space that event took up to say "1 more..." as well.
          if (prev && (prev === true || (prev.id === grid[y][x - 1].id))) {
            var id = prev.id;

            // Walk back down the row, stopping at `null` and `more` columns.
            for (i = x - 1; i >= 0 && grid[y][i] && !grid[y][i].more; --i) {
              var col = grid[y][i];

              // If the id of the event has been found and the current column id
              // does not match, time to go. The `id` aspect here is necessary
              // for the special case below.
              if (id && col.id && id !== col.id) break;
              if (!id && col.id) id = col.id;
              grid[y][i] = {more: 1};
            }
          }
        }

        // At this point if the spot is taken, move along.
        if (grid[y][x]) return;

        // Grab the next event up for display.
        var event = events.shift();
        added.push(event);
        var daySpan = getDaySpan(date, event.ends_at, tz);
        var colSpan = Math.min(daySpan, 7 - x);

        // Mark spots this event takes up as taken.
        for (i = x + 1; i < x + colSpan; i++) grid[y][i] = true;

        // This is the special case where an event starts on one day at non-
        // midnight and ends on a different day. For this case we have to create
        // a single column to display the start time and the event name,
        // followed by the remaining columns to show the end time.
        if (!event.is_all_day && event.starts_at > iso && colSpan > 1) {
          grid[y][x + 1] = {
            date: dateMom.clone().add('day', 1).format('YYYY-MM-DD'),
            span: colSpan - 1,
            hideTitle: true,
            event: event
          };
          colSpan = 1;
        }
        grid[y][x] = {date: date, span: colSpan, event: event};
      }, this);
    }, this);
    return grid;
  },

  renderHeader: function (n) {
    var tz = this.state.tz;
    var day = mom(this.props.date, tz).day(n);
    var formatted = day.format(day.date() === 1 ? 'MMMM D' : 'D');
    var now = mom(void 0, tz);
    return (
      <th key={n} className={day.isSame(now, 'day') ? 'osw-current-day' : null}>
        <div className='osw-day-wrapper'>{formatted}</div>
      </th>
    );
  },

  renderHead: function () {
    return <thead><tr>{_.times(7, this.renderHeader)}</tr></thead>;
  },

  renderColumn: function (col, y) {
    if (col === true) return;
    if (col === null) return <Column key={'empty-' + y} />;
    if (col.more) return  <Column key={'more-' + y} more={col.more} />;
    var i = _.indexOf(this.state.events, col.event);
    return (
      <Column
        key={'event-' + col.event.id + '-' + y}
        colSpan={col.span}
        date={col.date}
        hideTitle={col.hideTitle}
        cursors={{
          event: this.getCursor('events', i),
          tz: this.getCursor('tz')
        }}
      />
    );
  },

  renderRow: function (row, x) {
    return <tr key={x}>{_.map(row, this.renderColumn)}</tr>;
  },

  renderBody: function () {
    return (
      <tbody>{_.map(this.getGrid(), this.renderRow)}</tbody>
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
