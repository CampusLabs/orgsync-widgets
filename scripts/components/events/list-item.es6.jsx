/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import {mom, getColor} from 'entities/event';
import React from 'react';

var FORMAT = 'h:mm A';

export default React.createClass({
  mixins: [Cursors],

  formatWithVerb: function (time, verb) {
    var now = mom(void 0, this.props.tz);
    var suffix = time < now ? 'ed' : 's';
    return time.format('[' + verb + suffix + ' at ]h:mm A');
  },

  getTime: function () {
    var event = this.props.event;
    if (event.is_all_day) return 'All Day';
    var date = this.props.date;
    var tz = this.props.tz;
    var eventStart = mom(event.starts_at, tz);
    var eventEnd = mom(event.ends_at, tz);
    var dateStart = mom(date, tz);
    var dateEnd = dateStart.clone().add('day', 1);
    var startsBefore = eventStart <= dateStart;
    var endsAfter = eventEnd >= dateEnd;
    if (startsBefore && endsAfter) return 'All Day';
    if (!startsBefore && !endsAfter) {
      return eventStart.format(FORMAT) + ' - ' + eventEnd.format(FORMAT);
    }
    if (startsBefore) return this.formatWithVerb(eventEnd, 'End');
    return this.formatWithVerb(eventStart, 'Start');
  },

  getStyle: function () {
    var color = getColor(this.props.event, this.props.eventFilters);
    if (color) return {borderLeftColor: '#' + color};
  },

  renderRsvp: function () {
    var rsvp = this.props.event.rsvp;
    var icon =
      rsvp === 'Attending' || rsvp === 'Added by Admin' ? 'check' :
      rsvp === 'Maybe Attending' ? 'construction' :
      rsvp === 'Invited' ? 'info' :
      null;
    if (!icon) return;
    return (
      <span className={'osw-rsvp osw-' + _str.slugify(rsvp)}>
        <Icon name={icon} /> {rsvp}
      </span>
    );
  },

  renderDefaultPicture: function () {
    var dateMom = mom(this.props.date, this.props.tz);
    return (
      <div className='osw-default-picture'>
        <div className='osw-month'>{dateMom.format('MMM')}</div>
        <div className='osw-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  render: function () {
    var event = this.props.event;
    var src = event.thumbnail_url;
    return (
      <div className='osw-events-list-item' style={this.getStyle()}>
        <div className='osw-picture-container'>
          {src ? <img src={src} /> : this.renderDefaultPicture()}
        </div>
        <div className='osw-info'>
          <div className='osw-title'>{event.title}</div>
          <div className='osw-subtext'>
            <span className='osw-time'>{this.getTime()}</span>
            <span className='osw-portal-name'>{event.portal.name}</span>
            {this.renderRsvp()}
          </div>
        </div>
      </div>
    );
  }
});
