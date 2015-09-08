import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {fetch, getMoment} from 'entities/event';
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
      events: [{
        title: 'Event Title',
        date: 'Event Date',
        image: 'http://photos.orgsync.com/9lqs3un3sgmkyhn_90.jpg',
        link: 'http://orgsync.com.dev/25567/events/779390/occurrences/1617318'
      }],
      ranges: []
    }
  },

  componentDidMount: function () {
    this.fetch();
  },

  fetch: function () {
    if (this.state.isLoading || this.state.error) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});

    var options = {
      ranges: this.state.ranges,
      events: this.state.allEvents,
      url: this.props.eventsUrl
    };

    var now = getMoment(void 0, this.props.tz);
    var past = this.props.past;

      options[past ? 'before' : 'after'] = now.toISOString();
      options[past ? 'after' : 'before'] =
        now.add((past ? -1 : 1) * YEAR_LIMIT, 'years').toISOString();
    if (past) options.direction = 'backwards';
    api.get(options.url, {
      upcoming: past,
      per_page: 3,
      after: options.after,
      before: options.before,
      direction: options.direction,
      restrict_to_portal: false
    }, _.partial(this.handleFetch, options));

  },


  handleFetch: function (er, events) {
    console.log(er, events);
  },

  renderListItem: function (event) {
    return (
      <li className='media'>
        <div className='pull-left'>
          <img className='event-thumbnail' src={event.image} />
        </div>
        <div className='media-body'>
          <a href={event.link}>
            {event.title}
            <div className='subtle-text'>{event.date}</div>
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

  render: function () {
    return (
      <div className='panel'>
        <div className='panel-header'>
          <h4>{ this.props.past ? 'Past' : 'Upcoming' } Ongoing Events</h4>
        </div>
        <div className='panel-body'>
          {this.renderList()}
        </div>
        <div className='panel-footer'>
          <a href={`${this.props.baseUrl}/events/ongoing?past=${this.props.past}`}
            className='see-all-link'>See All</a>
        </div>
      </div>
    );
  }
});
