import _ from 'underscore';
import React from 'react';

export default React.createClass({

  getDefaultProps: function () {
    return {
      events: [],
      past: false
    }
  },

  displayEvent: function (event) {
    return (
      <li className='media'>
        <div className='pull-left'
          dangerouslySetInnerHTML={{
            __html: event.thumbnail
          }} />
        <div className='media-body'>
          <span dangerouslySetInnerHTML={{
            __html: event.link_and_title
          }} />
          <div className='subtle-text'>
            {event.time}
          </div>
        </div>
      </li>
    );
  },

  render: function () {

    if (this.props.past) {
      var title = 'Past Ongoing Events';
    } else {
      var title = 'Upcoming Ongoing Events';
    }

    return (
      <div className='panel'>
        <div className='panel-header'><h4>{title}</h4></div>
        <div className='panel-body'>
          <ul className='media-list'>
            {_.map(this.props.events, this.displayEvent)}
          </ul>
        </div>
        <div className='panel-footer'>
          <a href='/events/ongoing?past=true' className='see-all-link'>
            See All
          </a>
        </div>
      </div>
    );
  }
});
