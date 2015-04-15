import moment from 'moment';
import React from 'react';
import {getPictureUrl} from 'entities/account';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-media'>
        <div className='osw-pull-left'>
          <img
            src={getPictureUrl(this.props.account)}
          />
        </div>
        <div className='osw-media-body'>
          {this.props.account.display_name}<br />
          <span className='subtle-text'>{moment(this.props.createdAt).fromNow()}</span>
        </div>
      </div>
    );
  }
});
