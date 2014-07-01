/** @jsx React.DOM */

import _ from 'underscore';
import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import {getMoment} from 'entities/event';
import React from 'react';

var DATE_FORMAT = 'dddd, MMM D, YYYY';
var TIME_FORMAT = 'h:mm A';

export default React.createClass({
  mixins: [Cursors],

  getEventUrl: function () {
    var event = this.props.event;
    return event.links.web + '/occurrences/' + event.id;
  },

  getLocationUrl: function () {
    return 'https://www.google.com/maps/dir//' +
      encodeURIComponent(this.props.event.location);
  },

  getTime: function () {
    return 'TBD';
    var event = this.props.event;
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

  renderDefaultPicture: function () {
    var dateMom = getMoment(this.props.event.starts_at, this.props.tz);
    return (
      <div>
        <div className='osw-events-show-month'>{dateMom.format('MMM')}</div>
        <div className='osw-events-show-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  renderTime: function () {
    var event = this.props.event;
    var startMom = getMoment(event.starts_at, this.props.tz);
    var endMom = getMoment(event.ends_at, this.props.tz);
    var isMultiDay = startMom.clone().add('day', 1).startOf('day') < endMom;
    var start = startMom.format(DATE_FORMAT);
    var end, time;
    if (event.is_all_day) {
      if (isMultiDay) {
        start += ' -';
        end = startMom.format(DATE_FORMAT);
      }
      time = 'All Day';
    } else {
      if (isMultiDay) {

      } else {
        time = startMom.format(TIME_FORMAT) + ' - ' +
          endMom.format(TIME_FORMAT + ' z');
      }
    }
    var startTime = event.is_all_day ? 'All Day' : startMom.format('h:mm A z');
    var endTime = event.is_all_day ? 'All Day' : startMom.format('h:mm A z');
    return (
      <div className='osw-events-show-section'>
        <Icon name='time' />
        <div className='osw-events-show-section-main'>
          <div>{start}</div>
          {end ? <div>{end}</div> : null}
          {time ? <div className='osw-events-show-time'>{time}</div> : null}
        </div>
      </div>
    );
  },

  renderRsvp: function () {
    var rsvp = this.props.event.rsvp;
    var icon =
      rsvp === 'Attending' || rsvp === 'Added by Admin' ? 'check' :
      rsvp === 'Maybe Attending' ? 'construction' :
      rsvp === 'Invited' ? 'info' :
      null;
    return (
      <div className='osw-events-show-section'>
        <Icon name='rsvp' />
        <div className='osw-events-show-section-main'>
          <span className='osw-events-show-time'>{this.getTime()}</span>
        </div>
      </div>
    );
  },

  renderLocation: function () {
    var location = this.props.event.location;
    if (!location) return;
    return (
      <div className='osw-events-show-section'>
        <Icon name='location' />
        <div className='osw-events-show-section-main'>
          <a className='osw-events-show-location' href={this.getLocationUrl()}>
            {location}
          </a>
        </div>
      </div>
    );
  },

  renderPortalName: function () {
    var portal = this.props.event.portal;
    return (
      <div className='osw-events-show-section'>
        <Icon name='organization' />
        <div className='osw-events-show-section-main'>
          <a className='osw-events-show-portal-name' href={portal.links.web}>
            {portal.name}
          </a>
        </div>
      </div>
    );
  },

  renderDescription: function () {
    var description = this.props.event.description;
    if (description) description = _str.trim(description);
    if (!description) return;
    var blocks = description.split(/\r?\n/);
    var components = _.reduce(blocks, function (blocks, block, i) {
      if (i > 0) blocks.push(<br key={'br-' + i} />);
      if (block) blocks.push(<span key={'span-' + i}>{block}</span>);
      return blocks;
    }, []);
    return (
      <div className='osw-events-show-section'>
        <Icon name='info' />
        <div className='osw-events-show-section-main'>{components}</div>
      </div>
    );
  },

  render: function () {
    var event = this.props.event;
    var src = event.thumbnail_url;
    return (
      <div className='osw-events-show'>
        <div className='osw-events-show-picture-container'>
          {src ? <img src={src} /> : this.renderDefaultPicture()}
        </div>
        <div className='osw-events-show-info'>
          <a href={this.getEventUrl()} className='osw-events-show-title'>
            {event.title}
          </a>
          {this.renderTime()}
          {this.renderLocation()}
          {this.renderRsvp()}
          {this.renderPortalName()}
          {this.renderDescription()}
        </div>
      </div>
    );
  }
});
