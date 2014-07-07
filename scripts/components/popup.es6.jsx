/** @jsx React.DOM */

import _ from 'underscore';
import elementQuery from 'elementQuery';
import Icon from 'components/icon';
import Olay from 'olay-react';
import React from 'react';

export default React.createClass({
  getDefaultProps: function () {
    return {
      displayCloseButton: true
    };
  },

  componentDidMount: function () {
    if (this.hasChildren()) elementQuery();
  },

  componentDidUpdate: function () {
    if (this.hasChildren()) elementQuery();
  },

  hasChildren: function () {
    return _.any([].concat(this.props.children));
  },

  renderPopup: function () {
    if (!this.hasChildren()) return;
    return (
      <div className={'osw-popup osw-' + this.props.name + '-popup'}>
        <div className='osw-popup-head'>
          {this.renderCloseButton()}
          <div className='osw-popup-title'>{this.props.title}</div>
        </div>
        <div className='osw-popup-body'>{this.props.children}</div>
      </div>
    );
  },

  renderCloseButton: function () {
    if (!this.props.displayCloseButton) return;
    return (
      <Icon
        name='delete'
        className='osw-popup-close-button'
        onClick={this.props.close}
      />
    );
  },

  render: function () {
    return <Olay close={this.props.close}>{this.renderPopup()}</Olay>;
  }
});
