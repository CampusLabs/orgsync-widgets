/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import ListItem from 'components/events/list-item';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      events: []
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events
    };
  },

  renderEvent: function (event) {
    var i = _.indexOf(this.state.allEvents, event);
    return (
      <ListItem
        key={event.id}
        date={'2014-06-25'}
        cursors={{
          event: this.getCursor('allEvents', i)
        }}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-events-list'>
        <List
          items={this.state.events}
          renderItem={this.renderEvent}
        />
      </div>
    );
  }
});
