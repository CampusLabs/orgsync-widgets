/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    var comment = this.props.comment;
    var account = this
    return (
      <div class='osw-comment'>
        <div class='osw-comment-picture'>
          <img src={this.props.comment.get('avatar')} />
        </div>
        <div class='info'>
          // <div class='name'>this.props.comm</div>
          // <div class='time'>{{time}}</div>
          // <div class='content'>{{content}}</div>
        </div>
      </div>
    );
  }
});


