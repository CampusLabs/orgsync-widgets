import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import Popup from 'components/ui/popup';
import React from 'react';
import Sep from 'components/ui/sep';
import Show from 'components/events/show';

import {getMoment, getColor} from 'entities/event';

var FORMAT = 'h:mm A';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      showIsOpen: false
    };
  },

  openShow: function () {
    this.update({showIsOpen: {$set: true}});
  },

  closeShow: function () {
    this.update({showIsOpen: {$set: false}});
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
    var dateEnd = dateStart.clone().add(1, 'day');
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
    if (!this.state.showIsOpen) return;
    return (
      <Show
        tz={this.props.tz}
        cursors={{event: this.getCursor('event')}}
      />
    );
  },

  renderShowPopup: function () {
    return (
      <Popup name='events-show' close={this.closeShow} title='Event Details'>
        {this.renderShow()}
      </Popup>
    );
  },

  renderPortalName: function (event) {
    if (event.portal.id === this.props.portalId) return;

    return (
      <span>
        <Sep />
        <span className='osw-events-list-item-portal-name'>
          {event.portal.name}
        </span>
      </span>
    );
  },

  renderEventTypeIcon: function (event) {
    if (event.portal.umbrella_id) return;

    if (event.is_opportunity) {
      return <Icon name='service' className='osw-event-type-icon'/>;
    } else {
      return <Icon name='umbrella' className='osw-event-type-icon'/>;
    }
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
          {this.renderEventTypeIcon(event)}
          <div className='osw-events-list-item-info'>
            <div className='osw-events-list-item-title'>{event.title}</div>
            <div className='osw-events-list-item-subtext'>
              <span className='osw-events-list-item-time'>
                {this.getTime()}
              </span>
              {this.renderPortalName(event)}
              {this.renderRsvp()}
            </div>
          </div>
        </div>
        {this.renderShowPopup()}
      </div>
    );
  }
});
