import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Button from 'components/ui/button';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';
import RsvpButtons from 'components/events/rsvp-buttons';
import Sep from 'components/ui/sep';

import {getMoment, isAllDay, mergeResponse} from 'entities/event';

var DATE_FORMAT = 'dddd, MMM D, YYYY';
var TIME_FORMAT = 'h:mm A';

export var Section = React.createClass({
  mixin: [Cursors],

  render: function () {
    return (
      <div className='osw-events-show-section'>
        <Icon name={this.props.icon} />
        <div className='osw-events-show-section-main'>
          {this.props.children}
        </div>
      </div>
    );
  }
});

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentDidMount: function () {
    this.fetch();
  },

  getIcsUrl: function () {
    return api.url(this.state.event.links.ics);
  },

  getGcalUrl: function () {
    return api.url(this.state.event.links.gcal);
  },

  getLocationUrl: function () {
    return 'https://www.google.com/maps/dir//' +
      encodeURIComponent(this.state.event.location);
  },

  fetch: function () {
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(this.state.event.links.show, this.handleFetch);
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.event = {$merge: mergeResponse(this.state.event, res.data)};
    this.update(deltas);
  },

  renderDefaultPicture: function () {
    var dateMom = getMoment(this.state.event.starts_at, this.props.tz);
    return (
      <div>
        <div className='osw-events-show-month'>{dateMom.format('MMM')}</div>
        <div className='osw-events-show-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  renderTime: function () {
    var event = this.state.event;
    var tz = this.props.tz;
    var startMom = getMoment(event.starts_at, tz);
    var endMom = getMoment(event.ends_at, tz);
    var isMultiDay = startMom.clone().add(1, 'day').startOf('day') < endMom;
    var start = startMom.format(DATE_FORMAT);
    var end, time;
    if (isAllDay(event, tz)) {
      if (isMultiDay) {
        start += ' -';
        end = endMom.clone().subtract(1, 'day').format(DATE_FORMAT);
      }
      time = 'All Day';
    } else {
      if (isMultiDay) {
        start += ' ' + startMom.format(TIME_FORMAT + ' z') + ' -';
        end = endMom.format(DATE_FORMAT + ' ' + TIME_FORMAT + ' z');
      } else {
        time = startMom.format(TIME_FORMAT) + ' - ' +
          endMom.format(TIME_FORMAT + ' z');
      }
    }
    return (
      <Section icon='time' >
        <div>{start}</div>
        {end ? <div>{end}</div> : null}
        {time ? <div className='osw-events-show-time'>{time}</div> : null}
        <div className='osw-events-show-add-to-calendar'>
          <a href={this.getIcsUrl()} target='_parent'>Add to iCal/Outlook</a>
          <Sep />
          <a href={this.getGcalUrl()} target='_parent'>
            Add to Google Calendar
          </a>
        </div>
      </Section>
    );
  },

  renderLocation: function () {
    var location = this.state.event.location;
    if (!location) return;
    return (
      <Section icon='location'>
        <a
          className='osw-events-show-location'
          href={this.getLocationUrl()}
          target='_parent'
        >
          {location}
        </a>
      </Section>
    );
  },

  renderPortalName: function () {
    var portal = this.state.event.portal;
    return (
      <Section icon='organization'>
        <a
          className='osw-events-show-portal-name'
          href={portal.links.web}
          target='_parent'
        >
          {portal.name}
        </a>
      </Section>
    );
  },

  renderDescription: function () {
    var description = this.state.event.description;
    if (description) description = _str.trim(description);
    if (!description) return;
    var blocks = description.split(/\r?\n/);
    var components = _.reduce(blocks, function (blocks, block, i) {
      if (i > 0) blocks.push(<br key={'br-' + i} />);
      if (block) blocks.push(<span key={'span-' + i}>{block}</span>);
      return blocks;
    }, []);
    return <Section icon='info'>{components}</Section>;
  },

  render: function () {
    var event = this.state.event;
    var src = event.thumbnail_url;
    return (
      <div className='osw-events-show'>
        <div className='osw-events-show-picture-container'>
          {src ? <img src={src} /> : this.renderDefaultPicture()}
        </div>
        <div className='osw-events-show-info'>
          <a
            className='osw-events-show-title'
            href={event.links.web}
            target='_parent'
          >
            {event.title}
          </a>
          {this.renderTime()}
          {this.renderLocation()}
          <RsvpButtons cursors={{event: this.getCursor('event')}} />
          {this.renderPortalName()}
          {this.renderDescription()}
          <div className='osw-events-show-see-full-details'>
            <Button href={event.links.web} target='_parent'>
              See Full Details
            </Button>
          </div>
        </div>
      </div>
    );
  }
});
