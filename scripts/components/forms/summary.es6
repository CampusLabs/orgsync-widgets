import _ from 'underscore';
import Button from 'components/ui/button';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getFilters: function () {
    return _.pick(this.state, 'query', 'category');
  },

  renderMessage: function () {
    var any = _.any(this.getFilters());
    var l = this.props.forms.length;
    return 'Showing ' + (any ? '' : 'all ') + l + ' form' +
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
