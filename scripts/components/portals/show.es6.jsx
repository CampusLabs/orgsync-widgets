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
      success: this.handleSuccess,
      error: this.handleError
    });
  },

  handleSuccess: function () {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (portal, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  renderDescription: function () {
    if (this.state.isLoading) return 'Loading...';
    if (this.state.error) return this.state.error;
    return this.props.portal.get('description');
  },

  renderWebsiteLink: function () {
    var url = this.props.portal.get('website_url');
    return url && <a href={url} className='osw-button'>Website</a>;
  },

  render: function () {
    var portal = this.props.portal;
    return (
      <div className='osw-portals-show'>
        <div className='osw-picture'>
          <img src={portal.picture()} alt={portal.get('name')} />
        </div>
        <div className='osw-name'>{portal.get('name')}</div>
        <div className='osw-umbrella'>{portal.umbrellaName()}</div>
        <div className='osw-category'>{portal.get('category').get('name')}</div>
        <div className='osw-description'>{this.renderDescription()}</div>
        <a href={portal.get('links').web} className='osw-button'>
          On OrgSync.com
        </a>
        {this.renderWebsiteLink()}
      </div>
    );
  }
});
