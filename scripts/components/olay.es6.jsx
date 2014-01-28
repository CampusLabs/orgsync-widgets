/** @jsx React.DOM */

import elementQuery from 'elementQuery';
import Icon from 'components/icon';
import Olay from 'olay';
import React from 'react';

export default React.createClass({
  show: function () {
    var olay = this.olay;
    if (!olay) {
      olay = this.olay = new Olay(null, this.props.options);
      olay.$container
        .addClass('orgsync-widget')
        .addClass(this.props.className + '-olay');
      React.renderComponent(this, olay.show().$content[0]);
      olay.setElement(this.getDOMNode());
    }
    olay.show();
    elementQuery();
  },

  hide: function () {
    this.olay.hide();
  },

  hasFocus: function () {
    if (!this.olay) return false;
    var olays = document.getElementsByClassName('js-olay-container');
    return olays[olays.length - 1] === this.olay.$container[0];
  },

  render: function () {
    return (
      <div>
        <div className='js-olay-hide close-icon'><Icon name='delete' /></div>
        {this.props.component}
      </div>
    );
  }
});
