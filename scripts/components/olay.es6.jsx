/** @jsx React.DOM */

import _ from 'underscore';
import elementQuery from 'elementQuery';
import Icon from 'components/icon';
import Olay from 'olay';
import React from 'react';

export default React.createClass({
  statics: {
    create: function (props, children) {
      var olay = new Olay('<div>', props.options);
      olay.$container
        .addClass('orgsync-widget')
        .addClass('osw-' + props.className + '-olay');
      props = _.extend({olay: olay}, props);
      return React.renderComponent(this(props, children), olay.$el[0]);
    }
  },

  show: function () {
    this.props.olay.show();
    elementQuery();
  },

  hide: function () {
    this.props.olay.hide();
  },

  hasFocus: function () {
    if (!this.props.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.props.olay.$container[0];
  },

  render: function () {
    return (
      <div>
        <div className='js-olay-hide osw-close-icon'>
          <Icon name='delete' />
        </div>
        {this.props.children}
      </div>
    );
  }
});
