/** @jsx React.DOM */

import Cursors from 'cursors';
import mom from 'mom';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-events-column'];
    if (this.props.isCurrentDay) classes.push('osw-current-day');
    var event = this.state.event;
    if (event) {
      if (event.is_all_day) classes.push('osw-all-day');
      if (this.isContinued()) classes.push('osw-continued');
      if (this.doesContinue()) classes.push('osw-continues');
    }
    return classes.join(' ');
  },

  getShortTime: function (date) {
    return mom(date, this.state.tz)
      .format('h:mma')
      .replace(':00', '')
      .replace('m', '');
  },

  getTime: function () {
    var event = this.state.event;
    if (event.is_all_day) return;
    var isContinued = this.isContinued();
    if (isContinued && this.doesContinue()) return;
    if (isContinued) return this.getEndTime();
    return this.getStartTime();
  },

  getStartTime: function () {
    return this.getShortTime(this.state.event.starts_at);
  },

  getEndTime: function () {
    var endDay = mom(this.props.first, this.state.tz)
      .add('days', this.props.colSpan).toISOString();
    var event = this.state.event;
    if (event.ends_at >= endDay) return;
    return 'ends ' + this.getShortTime(event.ends_at);
  },

  isContinued: function () {
    var event = this.state.event;
    var start = this.props.first;
    var tz = this.state.tz;
    if (!event.is_all_day) start = mom(start, tz).toISOString();
    return event.starts_at < start;
  },

  doesContinue: function () {
    var event = this.state.event;
    var tz = this.state.tz;
    var start = this.props.first;
    var endMom = mom(start, tz).add('days', this.props.colSpan);
    var end =
      event.is_all_day ?
      endMom.format('YYYY-MM-DD') :
      endMom.toISOString();
    return event.ends_at > end;
  },

  isAllDay: function () {
    var event = this.state.event;
    if (event.is_all_day) return true;
    var tz = this.state.tz;
    var startMom = mom(this.props.first, tz);
    var dayStart = startMom.toISOString();
    var dayEnd = startMom.add('day', 1).toISOString();
    if (event.starts_at > dayStart || event.ends_at < dayEnd) return false;
    return true;
  },

  renderRemaining: function () {
    return (
      <div className='osw-remaining'>
        And {this.props.remaining} more...
      </div>
    );
  },

  renderTitle: function () {
    if (this.props.hideTitle) return;
    return <div className='osw-title'>{this.state.event.title}</div>;
  },

  renderEvent: function () {
    return (
      <div className='osw-event'>
        <div className='osw-time'>{this.getTime()}</div>
        {this.renderTitle()}
      </div>
    );
  },

  render: function () {
    var event = this.state.event;
    var remaining = this.props.remaining;
    return (
      <td className={this.getClassName()} colSpan={this.props.colSpan}>
        {event ? this.renderEvent() : remaining ? this.renderRemaining() : null}
      </td>
    );
  }
});
