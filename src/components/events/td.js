import Cursors from 'cursors';
import Popup from 'components/ui/popup';
import React from 'react';
import Show from 'components/events/show';
import tinycolor from 'tinycolor';

import {getMoment, getColor, isAllDay} from 'entities/event';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      showIsOpen: false
    };
  },

  getClassName: function () {
    var classes = ['osw-events-td'];
    var event = this.state.event;
    if (event) {
      var tz = this.props.tz;
      if (isAllDay(event, tz)) classes.push('osw-events-td-all-day');
      if (this.isContinued()) classes.push('osw-events-td-continued');
      if (this.doesContinue()) classes.push('osw-events-td-continues');
      var rsvp = event.rsvp;
      var type =
        rsvp === 'Attending' || rsvp === 'Added by Admin' ? 'attending' :
        rsvp === 'Maybe Attending' ? 'maybe-attending' :
        rsvp === 'Invited' ? 'invited' :
        null;
      if (type) classes.push('osw-events-td-' + type);
    }
    return classes.join(' ');
  },

  getEventStyle: function () {
    var event = this.state.event;
    var color = getColor(event, this.props.eventFilters);
    if (!color) return;
    if (color === 'ffffff') color = '888888';
    var style = {borderColor: '#' + color};
    var tz = this.props.tz;
    if (isAllDay(event, tz) || this.isContinued() || this.doesContinue()) {
      style.background = tinycolor(color).lighten(40).toHexString();
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
    return this.getFormattedTime(this.state.event.starts_at);
  },

  getEndTime: function () {
    var endIso = getMoment(this.props.date, this.props.tz)
      .add(this.props.colSpan, 'days').toISOString();
    var event = this.state.event;
    if (event.ends_at >= endIso) return;
    return 'ends ' + this.getFormattedTime(event.ends_at);
  },

  getTime: function () {
    var event = this.state.event;
    if (isAllDay(event, this.props.tz)) return;
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
    if (!event.is_all_day) {
      start = getMoment(start, this.props.tz).toISOString();
    }
    return event.starts_at < start;
  },

  doesContinue: function () {
    var event = this.state.event;
    var tz = this.props.tz;
    var start = this.props.date;
    var endMom = getMoment(start, tz).add(this.props.colSpan, 'days');
    var end =
      event.is_all_day ?
      endMom.format('YYYY-MM-DD') :
      endMom.toISOString();
    return event.ends_at > end;
  },

  startsAtMidnight: function () {
    return this.state.event.starts_at ===
      getMoment(this.props.date, this.props.tz).toISOString();
  },

  openShow: function () {
    this.update({showIsOpen: {$set: true}});
  },

  closeShow: function () {
    this.update({showIsOpen: {$set: false}});
  },

  renderMore: function () {
    return (
      <div
        className='osw-events-td-more'
        onClick={this.props.openDate}
      >
        {this.props.more + ' more...'}
      </div>
    );
  },

  renderTitle: function () {
    if (this.props.hideTitle) return;
    return (
      <div className='osw-events-td-title'>
        {this.state.event.title}
      </div>
    );
  },

  renderEvent: function () {
    return (
      <div
        className='osw-events-td-event'
        style={this.getEventStyle()}
        onClick={this.openShow}
      >
        <div className='osw-events-td-time'>{this.getTime()}</div>
        {this.renderTitle()}
      </div>
    );
  },

  renderShowPopup: function () {
    if (!this.state.showIsOpen) return;
    return (
      <Popup name='events-show' close={this.closeShow} title='Event Details'>
        <Show
          tz={this.props.tz}
          cursors={{event: this.getCursor('event')}}
        />
      </Popup>
    );
  },

  render: function () {
    var event = this.state.event;
    var more = this.props.more;
    return (
      <td className={this.getClassName()} colSpan={this.props.colSpan}>
        {event ? this.renderEvent() : more ? this.renderMore() : null}
        {this.renderShowPopup()}
      </td>
    );
  }
});
