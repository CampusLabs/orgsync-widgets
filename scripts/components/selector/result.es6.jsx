/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import Icon from 'components/icon';
import {isArbitrary} from 'entities/selector/item';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  className: function () {
    var classes = ['osw-selector-result'];
    if (this.props.selected) classes.push('osw-selector-result-selected');
    if (this.props.active) classes.push('osw-selector-result-active');
    return classes.join(' ');
  },

  getImageStyle: function () {
    var src = this.props.item.image_url;
    if (!src) return {};
    if (src[0] === '/') src = 'https://orgsync.com' + src;
    return {backgroundImage: "url('" + src + "')"};
  },

  getIcon: function () {
    var item = this.props.item;
    var name =
      this.props.selected ?
        'delete' :
          isArbitrary(item) ?
          'add' :
          _str.dasherize(item.type).slice(1);
    return <Icon name={name} />;
  },

  getName: function () {
    var item = this.props.item;
    var name = item.name;
    var verb = this.props.selected ? 'Remove' : 'Add';
    return isArbitrary(item) ? verb + ' "' + name + '"...' : name;
  },

  render: function () {
    return (
      <div className={this.className()} onClick={this.props.onClick}>
        <div
          className='osw-selector-result-image'
          style={this.getImageStyle()}
        />
        <div className='osw-selector-result-name'>
          {this.getIcon()}{this.getName()}
        </div>
      </div>
    );
  }
});
