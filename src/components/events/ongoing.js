import _ from 'underscore';
import api from '../../utils/api';
import Cursors from 'cursors';
import {getMoment} from '../../entities/event';
import React from 'react';

var MAX_LENGTH = 50;
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
      per_page: MAX_LENGTH + 1,
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

  renderEventsLength: function () {
    const {length} = this.state.events;
    return length > MAX_LENGTH ? `${MAX_LENGTH}+` : length;
  },

  render: function () {
    if (!this.state.events.length) return null;

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
                {this.renderEventsLength()}
              </div>
              <span className='osw-view-ongoing-link'>
                <span>
                  View {this.renderEventsLength()} {this.props.past ? 'Past ' : ''}
                  Ongoing Event{this.state.events.length > 1 ? 's' : ''}
                </span><br/>
                <span className='osw-subtle-text'>Ongoing Events typically have flexible dates and times</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
});
