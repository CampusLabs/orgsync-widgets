import elementQuery from 'element-query';
import Icon from 'components/ui/icon';
import Olay from 'olay-react';
import React from 'react';

export default React.createClass({
  getDefaultProps: function () {
    return {
      displayCloseButton: true
    };
  },

  componentDidMount: function () {
    this.runElementQuery();
  },

  componentDidUpdate: function () {
    this.runElementQuery();
  },

  runElementQuery() {
    requestAnimationFrame(() => elementQuery());
  },

  handleCloseClick: function (ev) {
    this.props.close();
    ev.stopPropagation();
  },

  renderPopup: function () {
    var children = this.props.children;
    if (!React.Children.count(children)) return;
    return (
      <div className={`osw-popup osw-${this.props.name}-popup`}>
        <div className='osw-popup-head'>
          {this.renderCloseButton()}
          <div className='osw-popup-title'>{this.props.title}</div>
        </div>
        <div className='osw-popup-body'>{children}</div>
      </div>
    );
  },

  renderCloseButton: function () {
    if (!this.props.displayCloseButton) return;
    return (
      <Icon
        name='delete'
        className='osw-popup-close-button'
        onClick={this.handleCloseClick}
      />
    );
  },

  render: function () {
    return (
      <Olay className='orgsync-widget' close={this.props.close}>
        {this.renderPopup()}
      </Olay>
    );
  }
});
