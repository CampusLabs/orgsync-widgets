/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import {getMoment, getColor} from 'entities/event';
import Olay from 'olay-react';
import React from 'react';
import Show from 'components/events/show';

var FORMAT = 'h:mm A';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      showIsOpen: false
    };
  },

  openShow: function () {
    this.update('showIsOpen', {$set: true});
  },

  closeShow: function () {
    this.update('showIsOpen', {$set: false});
  },

  formatWithVerb: function (time, verb) {
    var now = getMoment(void 0, this.props.tz);
    var suffix = time < now ? 'ed' : 's';
    return time.format('[' + verb + suffix + ' at ]h:mm A');
  },

  getTime: function () {
    var event = this.state.event;
    if (event.is_all_day) return 'All Day';
    var date = this.props.date;
    var tz = this.props.tz;
    var eventStart = getMoment(event.starts_at, tz);
    var eventEnd = getMoment(event.ends_at, tz);
    var dateStart = getMoment(date, tz);
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
    var color = getColor(this.state.event, this.props.eventFilters);
    if (color) return {borderLeftColor: '#' + color};
  },

  renderRsvp: function () {
    var rsvp = this.state.event.rsvp;
    var icon =
      rsvp === 'Attending' || rsvp === 'Added by Admin' ? 'check' :
      rsvp === 'Maybe Attending' ? 'construction' :
      rsvp === 'Invited' ? 'info' :
      null;
    if (!icon) return;
    return (
      <span className={'osw-events-list-item-' + _str.slugify(rsvp)}>
        <Icon name={icon} /> {rsvp}
      </span>
    );
  },

  renderDefaultPicture: function () {
    var dateMom = getMoment(this.props.date, this.props.tz);
    return (
      <div>
        <div className='osw-events-list-item-month'>
          {dateMom.format('MMM')}
          </div>
        <div className='osw-events-list-item-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  renderShow: function () {
    return (
      <Show
        tz={this.props.tz}
        cursors={{event: this.getCursor('event')}}
      />
    );
  },

  renderShowOlay: function () {
    return (
      <Olay close={this.closeShow}>
        {this.state.showIsOpen ? this.renderShow() : null}
      </Olay>
    );
  },

  render: function () {
    var event = this.state.event;
    var src = event.thumbnail_url;
    return (
      <div className='osw-events-list-item'>
        <div
          className='osw-events-list-item-content'
          style={this.getStyle()}
          onClick={this.openShow}
        >
          <div className='osw-events-list-item-picture-container'>
            {src ? <img src={src} /> : this.renderDefaultPicture()}
          </div>
          <div className='osw-events-list-item-info'>
            <div className='osw-events-list-item-title'>{event.title}</div>
            <div className='osw-events-list-item-subtext'>
              <span className='osw-events-list-item-time'>
                {this.getTime()}
              </span>
              <span className='osw-events-list-item-portal-name'>
                {event.portal.name}
              </span>
              {this.renderRsvp()}
            </div>
          </div>
        </div>
        {this.renderShowOlay()}
      </div>
    );
  }
});
