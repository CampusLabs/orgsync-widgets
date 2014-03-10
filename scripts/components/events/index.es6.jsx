/** @jsx React.DOM */

import _ from 'underscore';
import EventsIndexView from 'views/events/index';
import React from 'react';

export default React.createClass({
  componentDidMount: function () {
    new EventsIndexView(_.extend({el: this.getDOMNode()}, this.props));
  },

  render: function () {
    return <div />;
  }
});
