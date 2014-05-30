/** @jsx React.DOM */

import _ from 'underscore';
import elementQuery from 'elementQuery';
import Icon from 'components/icon';
import Olay from 'olay';
import React from 'react';

export default React.createClass({
  statics: {
    create: function (props) {
      var olay = new Olay('<div>', props.olayOptions);
      olay.$container
        .addClass('orgsync-widget')
        .addClass('osw-' + props.olayClassName + '-olay');
      props = _.extend({olay: olay}, props);
      var duration = olay.duration;
      olay.duration = 0;
      olay.show();
      var component = React.renderComponent(this(props), olay.$el[0]);
      olay.hide();
      olay.duration = duration;
      return component;
    }
  },

  getDefaultProps: function () {
    return {
      showHideOlayButton: true
    };
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

  renderHideButton: function () {
    if (!this.props.showHideOlayButton) return;
    return (
      <div className='js-olay-hide osw-hide-button'><Icon name='delete' /></div>
    );
  },

  render: function () {
    return (
      <div>
        {this.renderHideButton()}
        {this.props.component(this.props)}
      </div>
    );
  }
});
