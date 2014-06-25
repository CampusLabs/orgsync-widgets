/** @jsx React.DOM */

import Cursors from 'cursors';
import {mom} from 'entities/event';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-events-column'];
    var event = this.state.event;
    if (event) {
      if (event.is_all_day) classes.push('osw-all-day');
      if (this.isContinued()) classes.push('osw-continued');
      if (this.doesContinue()) classes.push('osw-continues');
    }
    return classes.join(' ');
  },

  getFormattedTime: function (date) {
    return mom(date, this.state.tz)
      .format('h:mma')
      .replace(':00', '')
      .replace('m', '');
  },

  getStartTime: function () {
    return this.getFormattedTime(this.state.event.starts_at);
  },

  getEndTime: function () {
    var endISO = mom(this.props.date, this.state.tz)
      .add('days', this.props.colSpan).toISOString();
    var event = this.state.event;
    if (event.ends_at >= endISO) return;
    return 'ends ' + this.getFormattedTime(event.ends_at);
  },

  getTime: function () {
    var event = this.state.event;
    if (event.is_all_day) return;
    var isContinued = this.isContinued();
    var doesContinue = this.doesContinue();
    if (isContinued && doesContinue) return;
    if (isContinued || (doesContinue && this.startsAtMidnight())) {
      return this.getEndTime();
    }
    return this.getStartTime();
  },

  isContinued: function () {
    var event = this.state.event;
    var start = this.props.date;
    if (!event.is_all_day) start = mom(start, this.state.tz).toISOString();
    return event.starts_at < start;
  },

  doesContinue: function () {
    var event = this.state.event;
    var tz = this.state.tz;
    var start = this.props.date;
    var endMom = mom(start, tz).add('days', this.props.colSpan);
    var end =
      event.is_all_day ?
      endMom.format('YYYY-MM-DD') :
      endMom.toISOString();
    return event.ends_at > end;
  },

  startsAtMidnight: function () {
    return this.state.event.starts_at ===
      mom(this.props.date, this.state.tz).toISOString();
  },

  renderMore: function () {
    return <div className='osw-more'>{this.props.more} more...</div>;
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
    var more = this.props.more;
    return (
      <td className={this.getClassName()} colSpan={this.props.colSpan}>
        {event ? this.renderEvent() : more ? this.renderMore() : null}
      </td>
    );
  }
});
