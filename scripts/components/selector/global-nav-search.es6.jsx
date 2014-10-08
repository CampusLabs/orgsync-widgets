/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import React from 'react';
import Selector from 'components/selector/index';
import store from 'entities/selector/store';
import superagent from 'superagent';

var serialize = superagent.serialize['application/x-www-form-urlencoded'];

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      allowBrowse: false,
      allowEmptyQuery: false,
      fields: ['name', 'portal.name', 'portal.short_name', '_type'],
      boostTypes: ['portal'],
      limit: 7,
      placeholder: 'Search for anything...'
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
    if (item._type === 'search') {
      location.assign('/search?' + serialize({
        q: item.q,
        school_id: window.CURRENT_SCHOOL_ID
      }));
    } else {
      location.assign('/search/redirect?' + serialize({
        type: _str.classify(item._type),
        id: item.id
      }));
    }
  },

  search: function (options) {
    return store.search(options).concat({
      _type: 'search',
      id: 1,
      name: 'See all results for "' + options.q + '"...',
      q: options.q
    });
  },

  render: function () {
    return this.transferPropsTo(
      <Selector
        className='osw-global-nav-search'
        search={this.search}
        cursors={{value: this.getCursor('value')}}
      />
    );
  }
});
