/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';
import Selector from 'components/selector/index';
import store from 'entities/selector/store';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      allowBrowse: false,
      allowEmptyQuery: false,
      fields: ['name', 'portal_long_name', 'portal_short_name', 'type'],
      indicesBoost: {portals: 10},
      limit: 8
    };
  },

  getInitialState: function () {
    return {
      value: []
    };
  },

  componentDidUpdate: function () {
    if (this.state.value.length) {
      this.handleSelection(this.state.value[0]);
      this.update({value: {$set: []}});
    }
  },

  handleSelection: function (item) {
    window.alert('Do something with\n' + JSON.stringify(item, null, 2));
  },

  search: function (options) {
    return store.search(options).concat({
      type: 'Search',
      id: 1,
      name: 'See all results for "' + options.q + '"...'
    });
  },

  render: function () {
    return this.transferPropsTo(
      <Selector
        search={this.search}
        cursors={{value: this.getCursor('value')}}
      />
    );
  }
});
