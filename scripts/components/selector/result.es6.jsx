/** @jsx React.DOM */

import Cursors from 'cursors';
import Icon from 'components/icon';
import {getIconName} from 'entities/selector/item';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  className: function () {
    var classes = [
      'osw-selector-result',
      'osw-selector-result-type-' + getIconName(this.props.item)
    ];
    if (this.props.isSelected) classes.push('osw-selector-result-selected');
    if (this.props.isActive) classes.push('osw-selector-result-active');
    return classes.join(' ');
  },

  getImageStyle: function () {
    var src = this.props.item.image_url;
    if (!src) return {};
    if (src[0] === '/') src = 'https://orgsync.com' + src;
    return {backgroundImage: "url('" + src + "')"};
  },

  renderIcon: function () {
    return (
      <div className='osw-selector-result-icon'>
        <Icon name={getIconName(this.props.item)} />
      </div>
    );
  },

  render: function () {
    var item = this.props.item;
    return (
      <div className={this.className()} onClick={this.props.onClick}>
        <div className='osw-selector-result-content'>
          <div
            className='osw-selector-result-image'
            style={this.getImageStyle()}
          >
            {item.image_url ? null : this.renderIcon()}
          </div>
          <div className='osw-selector-result-info'>
            <div className='osw-selector-result-name'>{item.name}</div>
            <div className='osw-selector-result-type'>
              {item.type}
            </div>
          </div>
        </div>
      </div>
    );
  }
});
