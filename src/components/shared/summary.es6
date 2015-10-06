import _ from 'underscore';
import Button from 'components/ui/button';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    filterKeys: React.PropTypes.array.isRequired,
    objectName: React.PropTypes.string,
    objects: React.PropTypes.array,
    showMessage: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      objectName: 'item',
      showMessage: true
    };
  },

  getFilters: function () {
    return _.pick(this.state, this.props.filterKeys);
  },

  renderMessage: function () {
    if (!this.props.showMessage) return '';
    var any = _.any(this.getFilters());
    var l = this.props.objects.length;
    return 'Showing ' + (any ? '' : 'all ') + l + ' ' + this.props.objectName +
      (l === 1 ? '' : 's') + (any ? ' matching ' : '.');
  },

  renderClearButtons: function () {
    return _.map(this.getFilters(), function (value, name) {
      if (!value) return null;
      var deltas = {};
      deltas[name] = {$set: ''};
      return (
        <Button key={name} onClick={_.partial(this.update, deltas)}>
          {value}
          <Icon name='delete' />
        </Button>
      );
    }, this);
  },

  render: function () {
    return (
      <div className='osw-portals-summary'>
        <div className='osw-portals-summary-message'>
          {this.renderMessage()}
        </div>
        <div className='osw-portals-summary-clear-buttons'>
          {this.renderClearButtons()}
        </div>
      </div>
    );
  }
});
