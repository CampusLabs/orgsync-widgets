/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='osw-forms-list-item'>
        <div className='osw-forms-list-item-inner'>
          <a href='#' onClick={this.handleClick}>
            <div className='osw-forms-icon'>
              <img src='http://www.toxicalgaenews.com/wp-content/uploads/2014/04/_d_improd_/form_icon_25603-150x150_f_improf_80x80.png' />
              <img className='creator-portrait' src={this.props.form.creator.picture_url} />
            </div>
            <div className='osw-forms-name'>
              {this.props.form.name}
            </div>
            <div className='osw-forms-category-name'>
              {this.props.form.category.name}
            </div>
            <div className='osw-forms-creator'>
              <div className='osw-forms-creator-name'>
                {this.props.form.creator.display_name}
              </div>
            </div>
            </a>
        </div>
      </div>
    );
  }
});
