import CommentsIndex from '../comments/index';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleImageClick: function () {
    if (this.props.onImageClick) this.props.onImageClick();
  },

  renderDescription: function () {
    var description = this.state.photo.description;
    if (!description) return;
    return (
      <div className='osw-photos-show-description'>{description}</div>
    );
  },

  render: function () {
    var photo = this.state.photo;
    return (
      <div className='osw-photos-show'>
        <div
          className='osw-photos-show-image'
          onClick={this.handleImageClick}
          style={{backgroundImage: "url('" + photo.full_url + "')"}}
        >
          {this.renderDescription()}
        </div>
        <CommentsIndex
          url={this.state.photo.links.comments}
          newUrl={this.state.photo.links.web}
          cursors={{comments: this.getCursor('photo', 'comments')}}
        />
      </div>
    );
  }
});
