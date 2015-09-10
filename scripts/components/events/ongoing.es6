import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {getMoment} from 'entities/event';
import React from 'react';

var LIST_LENGTH = 3;
var YEAR_LIMIT = 2;

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      past: false
    }
  },

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

    var past = this.props.past;
    var now = getMoment(void 0, this.props.tz);
    options[past ? 'before' : 'after'] = now.toISOString();
    options[past ? 'after' : 'before'] =
      now.add((past ? -1 : 1) * YEAR_LIMIT, 'years').toISOString();

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

  getTitle: function () {
    if (this.props.past) {
      return <span>View {this.state.events.length} Past Ongoing Events</span>;
    } else {
      return <span>View {this.state.events.length} Ongoing Events</span>;
    }
  },

  render: function () {
    if (!this.state.events.length) return <div></div>;

    return (
      <div>
        <div className='osw-events-list-date-header'>
          OnGoing Events
        </div>
        <div className='osw-events-list-item osw-ongoing-notice'>
          <div className='osw-events-list-item-content'>
            {this.renderLoading()}
            {this.renderEmpty()}
            <a href={`${this.props.baseUrl}/events/ongoing?past=${this.props.past}`}>
              <div className='osw-ongoing-callout'>
                {this.state.events.length}
              </div>
              <span className='osw-view-ongoing-link'>
                {this.getTitle()}<br/>
                <span className='osw-subtle-text'>Ongoing Events typically have flexible dates and times</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
});
