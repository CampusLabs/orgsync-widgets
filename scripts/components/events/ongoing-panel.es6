import _ from 'underscore';
import Cursors from 'cursors';
import React from 'react';

var LIST_LENGTH = 3;

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      past: false
    }
  },

  renderList: function () {
    return (
      <ul className='media-list'>
        <li className='media'>
          <div className='pull-left'>
            <img className='event-thumbnail' />
          </div>
          <div className='media-body'>
            <a href='#'>
              Event Name
              <div className='subtle-text'>Event Time</div>
            </a>
          </div>
        </li>
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
          <a href={`${this.props.baseUrl}/events/ongoing?past=${this.props.past}`} className='see-all-link'>See All</a>
        </div>
      </div>
    );
  }
});
