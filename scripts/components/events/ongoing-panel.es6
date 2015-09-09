import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {getMoment} from 'entities/event';
import React from 'react';

var LIST_LENGTH = 3;
var YEAR_LIMIT = 2;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null,
      events: []
    }
  },

  componentDidMount: function () {
    this.fetch();
  },

  fetch: function () {
    if (this.state.isLoading || this.state.error) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});

    var now = getMoment(void 0, this.props.tz);
    var options = {}

    options['after'] = now.toISOString();
    options['before'] = now.add(YEAR_LIMIT, 'years').toISOString();

    api.get(this.props.eventsUrl, {
      upcoming: true,
      per_page: LIST_LENGTH,
      after: options.after,
      before: options.before,
      restrict_to_portal: false,
      'occurrence_types[]': 'ongoing'
    }, _.partial(this.handleFetch));
  },

  handleFetch: function (er, events) {
    if (er) return console.log(er);
    this.update({
      isLoading: {$set: false},
      error: {$set: null},
      events: {$set: events.data}
    });
  },

  renderDefaultPicture: function (dateMom) {
    return (
      <div>
        <div className='osw-events-list-item-month'>
          {dateMom.format('MMM')}
          </div>
        <div className='osw-events-list-item-date'>{dateMom.format('D')}</div>
      </div>
    );
  },

  renderListItem: function (event) {
    var dateMom = getMoment(event.date, this.props.tz);
    var src = event.thumbnail_url;
    
    return (
      <li className='media'>
        <div className='pull-left'>
          {src ? <img src={src} className='event-thumbnail'/> : this.renderDefaultPicture(dateMom)}
        </div>
        <div className='media-body'>
          <a href={event.dates[0].links.web}>
            {event.title}
            <div className='subtle-text'>{dateMom.format('MMMM D, YYYY')}</div>
          </a>
        </div>
      </li>
    );
  },

  renderEmpty: function () {
    if (this.state.events.length > 0) return;

    return (
      <div className='osw-blank-slate-message'>
        No upcoming events to show.
      </div>
    );
  },

  renderLoading: function () {
    if (!this.state.isLoading) return;
    return <div className='osw-inset-block'>Loading...</div>;
  },

  render: function () {
    return (
      <div className='panel'>
        <div className='panel-header'>
          <h4>Ongoing Events</h4>
        </div>
        <div className='panel-body'>
          {this.renderLoading()}
          {this.renderEmpty()}
          <ul className='media-list'>
            {_.map(this.state.events, this.renderListItem)}
          </ul>
        </div>
        <div className='panel-footer'>
          <a href={`${this.props.baseUrl}/events/ongoing`}
            className='see-all-link'>See All</a>
        </div>
      </div>
    );
  }
});
