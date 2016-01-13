import _ from 'underscore';
import Cursors from 'cursors';
import Td from './td';
import ListDate from './list-date';
import Popup from '../ui/popup';
import React from 'react';

import {getMoment, getDaySpan} from '../../entities/event';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      openDate: null
    };
  },

  getEventsForDate: function (date) {
    var dateMom = getMoment(date, this.props.tz);
    var iso = dateMom.toISOString();
    dateMom.add(1, 'day');
    var endIso = dateMom.toISOString();
    var endDate = dateMom.format('YYYY-MM-DD');
    return _.filter(this.props.events, function (event) {
      var start = event.is_all_day ? date : iso;
      var end = event.is_all_day ? endDate : endIso;
      return event.ends_at > start && event.starts_at < end;
    });
  },

  getGrid: function () {
    var rows = this.props.rows;
    var added = [];
    var tz = this.props.tz;
    var grid = _.times(rows, _.partial(_.times, 7, _.constant(null)));
    const eventsForDate = {};
    _.times(7, function (x) {
      var dateMom = getMoment(this.props.date, tz).day(x);
      var iso = dateMom.toISOString();
      var date = dateMom.format('YYYY-MM-DD');

      // Find events for this day, then remove the events that have already been
      // added previously in the grid.
      eventsForDate[x] = this.getEventsForDate(date);
      const events = _.difference(eventsForDate[x], added);
      _.times(rows, function (y) {
        if (!events.length) return;

        // Show the more message.
        const more = eventsForDate[x].length - rows + 1;
        if (y === rows - 1 && more > 1) {
          var prev = grid[y][x];
          grid[y][x] = {more, date};

          // This is tricky. If a previous event was overlapping what will be
          // our more message, it is necessary to move backward and change the
          // space that event took up to say "1 more..." as well.
          const event = prev && prev.event;
          for (
            let i = x - 1, td;
            event && i >= 0 && (td = grid[y][i]) && td.event === event;
            --i
          ) td.more = 1;
        }

        // At this point if the spot is taken, move along.
        if (grid[y][x]) return;

        // Grab the next event up for display.
        var event = events.shift();
        added.push(event);
        var daySpan = getDaySpan(date, event.ends_at, tz);
        var colSpan = Math.min(daySpan, 7 - x);

        // Mark spots this event takes up as taken.
        for (let i = x + 1; i < x + colSpan; i++) {
          grid[y][i] = {
            colspan: 0,
            date: dateMom.clone().day(i).format('YYYY-MM-DD'),
            event
          };
        }

        // This is the special case where an event starts on one day at non-
        // midnight and ends on a different day. For this case we have to create
        // a single td to display the start time and the event name, followed by
        // the remaining tds to show the end time.
        if (!event.is_all_day && event.starts_at > iso && colSpan > 1) {
          grid[y][x + 1] = {
            date: dateMom.clone().day(x + 1).format('YYYY-MM-DD'),
            colSpan: colSpan - 1,
            hideTitle: true,
            event: event
          };
          colSpan = 1;
        }
        grid[y][x] = {date: date, colSpan: colSpan, event: event};
      }, this);
    }, this);
    return grid;
  },

  openDate: function (date) {
    this.update({openDate: {$set: date}});
  },

  closeDate: function () {
    this.update({openDate: {$set: null}});
  },

  renderHeader: function (n) {
    var tz = this.props.tz;
    var date = getMoment(this.props.date, tz).day(n);
    var formatted = date.format(date.date() === 1 ? 'MMMM D' : 'D');
    var now = getMoment(void 0, tz);
    return (
      <th
        key={n}
        className=
          {date.isSame(now, 'day') ? 'osw-events-week-current-day' : null}
      >
        <div
          className='osw-events-week-day-wrapper'
          onClick={_.partial(this.openDate, date.format('YYYY-MM-DD'))}
        >
          {formatted}
        </div>
      </th>
    );
  },

  renderHead: function () {
    return <thead><tr>{_.times(7, this.renderHeader)}</tr></thead>;
  },

  renderTd: function (td, y) {
    if (td === null) return <Td key={'empty-' + y} />;
    if (td.more) {
      return (
        <Td
          key={'more-' + y}
          more={td.more}
          openDate={_.partial(this.openDate, td.date)}
        />
      );
    }
    if (!td.colSpan) return;
    var i = this.state.allEvents.indexOf(td.event);
    return (
      <Td
        key={'event-' + td.event.id + '-' + y}
        colSpan={td.colSpan}
        date={td.date}
        hideTitle={td.hideTitle}
        eventFilters={this.props.eventFilters}
        tz={this.props.tz}
        cursors={{event: this.getCursor('allEvents', i)}}
      />
    );
  },

  renderRow: function (row, x) {
    return <tr key={x}>{_.map(row, this.renderTd)}</tr>;
  },

  renderBody: function () {
    return (
      <tbody>{_.map(this.getGrid(), this.renderRow)}</tbody>
    );
  },

  renderOpenDatePopup: function () {
    var date = this.state.openDate;
    if (!date) return;
    return (
      <Popup
        name='events-list-date'
        close={this.closeDate}
        title='Date Details'
      >
        <ListDate
          events={this.getEventsForDate(date)}
          eventFilters={this.props.eventFilters}
          date={date}
          tz={this.props.tz}
          cursors={{allEvents: this.getCursor('allEvents')}}
        />
      </Popup>
    );
  },

  render: function () {
    return (
      <div className='osw-events-week'>
        <table>
          {this.renderHead()}
          {this.renderBody()}
        </table>
        {this.renderOpenDatePopup()}
      </div>
    );
  }
});
