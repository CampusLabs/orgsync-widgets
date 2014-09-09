/** @jsx React.DOM */

import Cursors from 'cursors';
import Icon from 'components/icon';
import {isArbitrary, getIconName} from 'entities/selector/item';
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

  getName: function () {
    var item = this.props.item;
    var name = item.name;
    var verb = this.props.isSelected ? 'Remove' : 'Add';
    return isArbitrary(item) ? verb + ' "' + name + '"...' : name;
  },

  renderIcon: function () {
    var name = this.props.isSelected ? 'delete' : getIconName(this.props.item);
    return <div className='osw-selector-result-icon'><Icon name={name} /></div>;
  },

  render: function () {
    return (
      <div className={this.className()} onClick={this.props.onClick}>
        <div className='osw-selector-result-content'>
          <div
            className='osw-selector-result-image'
            style={this.getImageStyle()}
          >
            {this.props.item.image_url ? null : this.renderIcon()}
          </div>
          <div className='osw-selector-result-info'>
            <div className='osw-selector-result-name'>{this.getName()}</div>
            <div className='osw-selector-result-type'>
              {this.props.item.type}
            </div>
          </div>
        </div>
      </div>
    );
  }
});
