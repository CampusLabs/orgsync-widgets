import _ from 'underscore';
import _str from 'underscore.string';
import {Mixin as Cursors} from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

import {
  getIconName,
  getDisplayName,
  getPictureUrl
} from 'entities/selector/item';

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
    var src = getPictureUrl(this.props.item);
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
    var eventHandlers = _.pick(this.props, 'onMouseOver', 'onClick');
    return (
      <div {...eventHandlers} className={this.className()}>
        <div className='osw-selector-result-content'>
          <div
            className='osw-selector-result-image'
            style={this.getImageStyle()}
          >
            {getPictureUrl(item) ? null : this.renderIcon()}
          </div>
          <div className='osw-selector-result-info'>
            <div className='osw-selector-result-name'>
              {getDisplayName(item)}
            </div>
            <div className='osw-selector-result-type'>
              {_str.titleize(_str.humanize(item._type))}
            </div>
          </div>
        </div>
      </div>
    );
  }
});
