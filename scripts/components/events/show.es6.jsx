/** @jsx React.DOM */

import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Button from 'components/button';
import ButtonGroup from 'components/button-group';
import Cursors from 'cursors';
import Icon from 'components/icon';
import React from 'react';

import {getMoment, isAllDay} from 'entities/event';

var DATE_FORMAT = 'dddd, MMM D, YYYY';
var TIME_FORMAT = 'h:mm A';

var STATUS_MAP = {
  Yes: 'Attending',
  Maybe: 'Maybe Attending',
  No: 'Not Attending'
};

var ACTION_MAP = {
  Attending: 'Yes',
  'Added by Admin': 'Yes',
  'Maybe Attending': 'Maybe',
  'Not Attending': 'No'
};

var Section = React.createClass({
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

  getShowUrl: function () {
    var event = this.state.event;
    return event.links.show.replace(/\/\d+$/, '/occurrences/' + event.id);
  },

  getWebUrl: function () {
    var event = this.state.event;
    return event.links.web + '/occurrences/' + event.id;
  },

  getLocationUrl: function () {
    return 'https://www.google.com/maps/dir//' +
      encodeURIComponent(this.state.event.location);
  },

  fetch: function () {
    if ('rsvp_attendees' in this.state.event) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(this.getShowUrl(), this.handleFetch);
  },

  setRsvp: function (status) {

    // This temporary CORS enabling is required for non-GET requests until we
    // stop supporting IE9, at which point every request will use CORS.
    api.cors = true;
    api.post(this.state.event.links.rsvp, {
      occurs_at: this.state.event.starts_at,
      status: status
    }, this.handleRsvp);
    api.cors = false;
  },

  handleFetch: function (er, res) {
    this.update({isLoading: {$set: false}});
    if (er) return this.update({error: {$set: er}});
    this.update({event: {$merge: {
      rsvp_attendees: res.data.rsvp_attendees
    }}});
  },

  handleRsvp: function (er, res) {
    if (er) return window.alert('Unable to RSVP. Please try again.');
    var status = res.data.status;
    var filters = _.without(this.state.event.filters, 'rsvp');
    if (status !== 'Not Attending') filters = ['rsvp'].concat(filters);
    this.update({event: {rsvp: {$set: status}, filters: {$set: filters}}});
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
    var isMultiDay = startMom.clone().add('day', 1).startOf('day') < endMom;
    var start = startMom.format(DATE_FORMAT);
    var end, time;
    if (isAllDay(event, tz)) {
      if (isMultiDay) {
        start += ' -';
        end = endMom.format(DATE_FORMAT);
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
    var startTime = event.is_all_day ? 'All Day' : startMom.format('h:mm A z');
    var endTime = event.is_all_day ? 'All Day' : startMom.format('h:mm A z');
    return (
      <Section icon='time' >
        <div>{start}</div>
        {end ? <div>{end}</div> : null}
        {time ? <div className='osw-events-show-time'>{time}</div> : null}
      </Section>
    );
  },

  renderRsvpAction: function () {
    var event = this.state.event;
    var actions = event.rsvp_actions;
    if (!_.size(actions)) return;
    var buttons;
    if (actions[0] === 'Register') {
      buttons = <Button href={event.pre_event_form}>Yes, Register Now</Button>;
    } else {
      var userAction = ACTION_MAP[event.rsvp];
      buttons = actions.map(function (action) {
        return (
          <label key={action}>
            <input
              type='radio'
              name='rsvp'
              checked={action === userAction}
              onChange={_.partial(this.setRsvp, STATUS_MAP[action])}
            />
            {action}
          </label>
        );
      }, this);
    }
    return (
      <div className='osw-events-show-rsvp-action'>
        <div>Will you be attending?</div>
        {
          buttons ?
          <div className='osw-events-show-actions'>{buttons}</div> :
          null
        }
      </div>
    );
  },

  renderRsvp: function () {
    var message = this.state.event.rsvp_message;
    if (message) message = <div>{message}</div>;
    return (
      <Section icon='rsvp'>
        {this.renderRsvpAction()}
        {message}
      </Section>
    );
  },

  renderLocation: function () {
    var location = this.state.event.location;
    if (!location) return;
    return (
      <Section icon='location'>
        <a className='osw-events-show-location' href={this.getLocationUrl()}>
          {location}
        </a>
      </Section>
    );
  },

  renderPortalName: function () {
    var portal = this.state.event.portal;
    return (
      <Section icon='organization'>
        <a className='osw-events-show-portal-name' href={portal.links.web}>
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
          <a href={this.getWebUrl()} className='osw-events-show-title'>
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
