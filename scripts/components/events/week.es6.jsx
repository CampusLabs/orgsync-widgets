/** @jsx React.DOM */

import _ from 'underscore';
module EventOccurrence from 'entities/event-occurrence';
import React from 'react';

export default React.createClass({
  renderHeader: function (n) {
    var date = this.props.start.clone().day(n);
    var format = date.date() === 1 ? 'MMMM D' : 'D';
    return <th key={n}>{day.format(format)}</th>;
  },

  renderHead: function () {
    return <thead><tr>{_.times(7, this.renderHeader)}</tr></thead>;
  },

  renderColumn: function (n, added) {
    if (n >= 7) return [];
    var date = this.props.start.clone().day(n);
    var eventDay = this.props.eventDays.getByDate(date);
    var eventOccurrences = eventDay.get('eventOccurrences');
    var first = eventOccurrences.find(_.negate(added.get, added));
    added.add(first);
    var dayDiff = Math.ceil((first.end() - date) / (1000 * 60 * 60 * 24));
    var colspan = Math.min(7 - n, dayDiff);
    var rest = this.renderColumn(n + colspan, added);
    return [<td key={n} colspan={colspan}>{first}</td>].concat(rest);
  },

  renderRow: function (n, added) {
    return <tr key={n}>{this.renderColumn(0, added)}</tr>;
  },

  renderRows: function () {
    var added = new EventOccurrence.Collection();
    return (
      <tbody>
        {_.times(this.props.rows, _.partial(this.renderRow, _, added))}
      </tbody>
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
