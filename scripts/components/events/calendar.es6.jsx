/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import {mom} from 'entities/event';
import React from 'react';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Cursors],

  getStarts: function () {
    var first = mom(this.state.target, this.state.tz)
      .startOf('week').subtract('weeks', 1);
    return _.times(this.props.rows, function () {
      return first.add('weeks', 1).format('YYYY-MM-DD');
    });
  },

  renderDayName: function (n) {
    return (
      <th key={n}>
        <div className='osw-day-name'>
          {mom(void 0, this.state.tz).day(n).format('ddd')}
        </div>
      </th>
    );
  },

  renderDayNames: function () {
    return (
      <table className='osw-day-names'>
        <thead>
          <tr>{_.times(7, this.renderDayName)}</tr>
        </thead>
      </table>
    );
  },

  renderWeek: function (start) {
    return (
      <Week
        key={start}
        start={start}
        rows={4}
        cursors={{
          events: this.getCursor('events'),
          tz: this.getCursor('tz')
        }}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-events-calendar'>
        {this.renderDayNames()}
        {this.getStarts().map(this.renderWeek)}
      </div>
    );
  }
});
