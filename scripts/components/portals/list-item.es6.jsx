/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    if (this.props.onClick) this.props.onClick(this.props.portal);
  },

  fittedName: function () {
    var name = this.props.portal.get('name');
    return name.length > 80 ? this.props.portal.get('short_name') : name;
  },

  render: function () {
    var portal = this.props.portal;
    return (
      <div className='portals-list-item'>
        <a href={portal.get('links').web} onClick={this.onClick}>
          <div className='image-container'>
            <img src={portal.picture()} />
          </div>
          <div className='info'>
            <div className='name'>{this.fittedName()}</div>
            <div className='umbrella'>{portal.umbrellaName()}</div>
            <div className='category'>{portal.get('category').get('name')}</div>
          </div>
        </a>
      </div>
    );
  }
});
