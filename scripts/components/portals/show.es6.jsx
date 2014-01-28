/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount: function () {
    var portal = this.props.portal;
    if (portal.get('description') != null) return;
    this.setState({isLoading: true, error: null});
    portal.fetch({
      success: this.onSuccess,
      error: this.onError
    });
  },

  onSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  onError: function (portal, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  renderDescription: function () {
    if (this.state.isLoading) return 'Loading...';
    if (this.state.error) return this.state.error;
    return this.props.portal.get('description');
  },

  renderWebsiteLink: function () {
    var url = this.props.portal.get('website_url');
    return url && <a href={url} className='button'>Website</a>;
  },

  render: function () {
    var portal = this.props.portal;
    return (
      <div className='portals-show'>
        <div className='picture'>
          <img src={portal.picture()} alt={portal.get('name')} />
        </div>
        <div className='name'>{portal.get('name')}</div>
        <div className='umbrella'>{portal.umbrellaName()}</div>
        <div className='category'>{portal.get('category').get('name')}</div>
        <div className='description'>{this.renderDescription()}</div>
        {this.renderWebsiteLink()}
        <a href={portal.get('links').web} className='button'>On OrgSync.com</a>
      </div>
    );
  }
});
