/** @jsx React.DOM */

import Cursors from 'cursors';
import {getMoment, getColor} from 'entities/event';
import Olay from 'olay-react';
import React from 'react';
import Show from 'components/events/show';
import tinycolor from 'tinycolor';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      showIsOpen: false
    };
  },

  getClassName: function () {
    var classes = ['osw-events-column'];
    var event = this.props.event;
    if (event) {
      if (event.is_all_day) classes.push('osw-events-column-all-day');
      if (this.isContinued()) classes.push('osw-events-column-continued');
      if (this.doesContinue()) classes.push('osw-events-column-continues');
      var rsvp = event.rsvp;
      var type =
        rsvp === 'Attending' || rsvp === 'Added by Admin' ? 'attending' :
        rsvp === 'Maybe Attending' ? 'maybe-attending' :
        rsvp === 'Invited' ? 'invited' :
        null;
      if (type) classes.push('osw-events-column-' + type);
    }
    return classes.join(' ');
  },

  getEventStyle: function () {
    var event = this.props.event;
    var color = getColor(event, this.props.eventFilters);
    if (!color) return;
    var style = {borderLeftColor: '#' + color};
    if (event.is_all_day || this.isContinued() || this.doesContinue()) {
      style.background = tinycolor.lighten(color, 55).toHexString();
    }
    return style;
  },

  getFormattedTime: function (date) {
    return getMoment(date, this.props.tz)
      .format('h:mma')
      .replace(':00', '')
      .replace('m', '');
  },

  getStartTime: function () {
    return this.getFormattedTime(this.props.event.starts_at);
  },

  getEndTime: function () {
    var endIso = getMoment(this.props.date, this.props.tz)
      .add('days', this.props.colSpan).toISOString();
    var event = this.props.event;
    if (event.ends_at >= endIso) return;
    return 'ends ' + this.getFormattedTime(event.ends_at);
  },

  getTime: function () {
    var event = this.props.event;
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
    var event = this.props.event;
    var start = this.props.date;
    if (!event.is_all_day) start = getMoment(start, this.props.tz).toISOString();
    return event.starts_at < start;
  },

  doesContinue: function () {
    var event = this.props.event;
    var tz = this.props.tz;
    var start = this.props.date;
    var endMom = getMoment(start, tz).add('days', this.props.colSpan);
    var end =
      event.is_all_day ?
      endMom.format('YYYY-MM-DD') :
      endMom.toISOString();
    return event.ends_at > end;
  },

  startsAtMidnight: function () {
    return this.props.event.starts_at ===
      getMoment(this.props.date, this.props.tz).toISOString();
  },

  openShow: function () {
    this.update('showIsOpen', {$set: true});
  },

  closeShow: function () {
    this.update('showIsOpen', {$set: false});
  },

  renderMore: function () {
    return (
      <div
        className='osw-events-column-more'
        onClick={this.props.openDate}
      >
        {this.props.more + ' more...'}
      </div>
    );
  },

  renderTitle: function () {
    if (this.props.hideTitle) return;
    return (
      <div className='osw-events-column-title'>
        {this.props.event.title}
      </div>
    );
  },

  renderEvent: function () {
    return (
      <div
        className='osw-events-column-event'
        style={this.getEventStyle()}
        onClick={this.openShow}
      >
        <div className='osw-events-column-time'>{this.getTime()}</div>
        {this.renderTitle()}
      </div>
    );
  },

  renderShow: function () {
    return <Show event={this.props.event} tz={this.props.tz} />;
  },

  renderShowOlay: function () {
    return (
      <Olay close={this.closeShow}>
        {this.state.showIsOpen ? this.renderShow() : null}
      </Olay>
    );
  },

  render: function () {
    var event = this.props.event;
    var more = this.props.more;
    return (
      <td className={this.getClassName()} colSpan={this.props.colSpan}>
        {event ? this.renderEvent() : more ? this.renderMore() : null}
        {this.renderShowOlay()}
      </td>
    );
  }
});
