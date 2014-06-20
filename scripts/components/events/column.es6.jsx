/** @jsx React.DOM */

import Cursors from 'cursors';
import moment from 'moment-timezone';
import React from 'react/addons';

export default React.createClass({
  mixins: [Cursors],

  getEventClassName: function () {
    var classes = ['osw-event'];
    if (this.state.event.is_all_day) classes.push('osw-all-day');
    return classes.join(' ');
  },

  getTime: function () {
    var event = this.state.event;
    if (event.is_all_day) return;
    return moment.tz(event.starts_at, this.state.tz)
      .format('h:mma')
      .replace(':00', '')
      .replace('m', '');
  },

  renderRemaining: function () {
    return (
      <div className='osw-remaining'>
        And {this.props.remaining.length} more...
      </div>
    );
  },

  renderEvent: function () {
    var event = this.state.event;
    return (
      <div className={this.getEventClassName()}>
        <div className='osw-time'>{this.getTime()}</div>
        <div className='osw-title'>{event.title}</div>
      </div>
    );
  },

  render: function () {
    var event = this.state.event;
    var remaining = this.props.remaining;
    return (
      <td className={'osw-events-column'} colSpan={this.props.colSpan}>
        {event ? this.renderEvent() : remaining ? this.renderRemaining() : null}
      </td>
    );
  }
});
