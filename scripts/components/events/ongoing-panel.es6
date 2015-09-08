import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {fetch, getMoment} from 'entities/event';
import React from 'react';

var LIST_LENGTH = 3;
var YEAR_LIMIT = 2;
var FORMAT = 'h:mm A';

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
      events: [],
      past: false
    }
  },

  componentDidMount: function () {
    this.fetch();
  },

  fetch: function (past) {
    if (this.state.isLoading || this.state.error) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});

    var options = {
      url: this.props.eventsUrl
    };

    var now = getMoment(void 0, this.props.tz);
    var past = past || this.state.past;

      options[past ? 'before' : 'after'] = now.toISOString();
      options[past ? 'after' : 'before'] =
        now.add((past ? -1 : 1) * YEAR_LIMIT, 'years').toISOString();
    if (past) options.direction = 'backwards';
    api.get(options.url, {
      upcoming: !past,
      per_page: 3,
      after: options.after,
      before: options.before,
      direction: options.direction,
      restrict_to_portal: false
    }, _.partial(this.handleFetch));
  },

  handleFetch: function (er, events) {
    if (er) return console.log(er);

    if (events.data.length <= 0) {
      this.update({ past: {$set: true}});
      fetch(true);
    } else {
      this.update({
        isLoading: {$set: false},
        error: {$set: null},
        events: {$set: events.data}
      });
    }
  },

  renderListItem: function (event) {
    var dateMom = getMoment(event.date, this.props.tz);

    return (
      <li className='media'>
        <div className='pull-left'>
          <img className='event-thumbnail' src={event.thumbnail_url} />
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

  renderList: function () {
    return (
      <ul className='media-list'>
        {_.map(this.state.events, this.renderListItem)}
      </ul>
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
          <h4>{ this.state.past ? 'Past' : 'Upcoming' } Ongoing Events</h4>
        </div>
        <div className='panel-body'>
          {this.renderLoading()}
          {this.renderList()}
        </div>
        <div className='panel-footer'>
          <a href={`${this.props.baseUrl}/events/ongoing?past=${this.state.past}`}
            className='see-all-link'>See All</a>
        </div>
      </div>
    );
  }
});
