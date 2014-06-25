/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import {mom} from 'entities/event';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getTime: function () {
    return this.state.event.starts_at;
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
      <div className={'osw-rsvp osw-' + _str.slugify(rsvp)}>
        <Icon name={icon} /> {rsvp}
      </div>
    );
  },

  renderDefaultPicture: function () {
    var dateMom = mom(this.props.date, this.state.tz);
    return (
      <div className='osw-default-picture'>
        <div className='osw-month'>{dateMom.format('MMM')}</div>
        <div className='osw-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  render: function () {
    var event = this.state.event;
    var src = event.thumbnail_url;
    return (
      <div className='osw-events-list-item'>
        <div className='osw-picture-container'>
          {src ? <img src={src} /> : this.renderDefaultPicture()}
        </div>
        <div className='osw-info'>
          <div className='osw-title'>{event.title}</div>
          <div className='osw-time'>{this.getTime()}</div>
          <div className='osw-portal-name'>{event.portal.name}</div>
          {this.renderRsvp()}
        </div>
      </div>
    );
  }
});
