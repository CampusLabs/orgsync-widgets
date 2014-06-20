/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import moment from 'moment-timezone';
import React from 'react/addons';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Cursors],

  getStarts: function () {
    var first = moment(this.state.target).startOf('week').subtract('weeks', 1);
    return _.times(this.props.rows, function () {
      return first.add('weeks', 1).format('YYYY-MM-DD');
    });
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
        {this.getStarts().map(this.renderWeek)}
      </div>
    );
  }
});
