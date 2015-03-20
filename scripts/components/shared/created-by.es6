import React from 'react';
import {getPictureUrl} from 'entities/account';

export default React.createClass({
  render: function () {
    return (
      <div className='media'>
        <div className='pull-left'>
          <img
            src={getPictureUrl(this.props.account)}
          />
        </div>
        <div className='media-right'>
          {this.props.account.display_name}<br />
          <span className='subtle-text'>{this.props.createdAt}</span>
        </div>
      </div>
    );
  }
});
