/** @jsx React.DOM */

import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import CoercedPropsMixin from 'mixins/coerced-props';
import ListenersMixin from 'mixins/listeners';
import React from 'react';
import Selectize from 'selectize';
module SelectorBrowse from 'components/selector/browse';
module SelectorToken from 'entities/selector-token';
import Olay from 'components/olay';

export default React.createClass({
  mixins: [CoercedPropsMixin, ListenersMixin],

  getCoercedProps: function () {
    return {
      scope: {
        type: Backbone.Collection
      },
      value: {
        type: SelectorToken.Collection
      }
    };
  },

  getListeners: function () {
    return [{
      model: this.props.value,
      events: {
        add: this.addItem,
        remove: this.removeItem
      }
    }];
  },

  getDefaultProps: function () {
    return {
      allowArbitrary: false,
      maxItems: Infinity,
      scope: [],
      value: []
    };
  },

  componentDidMount: function () {
    var input = this.refs.input.getDOMNode();

    // Initialize Selectize.
    $(input).selectize({
      create: this.props.allowArbitrary && this.createItem,
      createOnBlur: true,
      persist: false,
      maxItems: this.props.maxItems,
      load: this.fetch,
      onChange: this.onChange,
      onItemAdd: this.onItemAdd,
      onItemRemove: this.onItemRemove
    });

    // Initialize the input.value with an empty array.
    input.value = '[]';

    // Set the initial value.
    this.props.value.each(this.addItem);
  },

  onChange: function (val) {
    this.refs.input.getDOMNode().value = '[' + val + ']';
  },

  onItemAdd: function (val, $item) {
    var i = $item.parent().children().index($item);
    var data = JSON.parse(val);
    if (!data.id && this.props.value.findWhere({name: data.name})) return;
    this.props.value.add(JSON.parse(val), {at: i});
  },

  onItemRemove: function (val) {
    var data = JSON.parse(val);
    var value = this.props.value;
    if (data.id) return value.remove(data.id);
    value.remove(value.findWhere({name: data.name}));
  },

  addItem: function (selectorToken) {
    var data = selectorToken.toSelectize();
    var input = this.refs.input.getDOMNode();
    var i = this.props.value.indexOf(selectorToken);
    input.selectize.addOption(data);
    input.selectize.setCaret(i);
    input.selectize.addItem(data.value);
    input.selectize.setCaret(i + 1);
  },

  removeItem: function (selectorToken) {
    var data = selectorToken.toSelectize();
    var input = this.refs.input.getDOMNode();
    input.selectize.removeItem(data.value);
  },

  createItem: function (data) {
    return (new SelectorToken.Model({name: data.name})).toSelectize();
  },

  fetch: function (query, cb) {
    if (this.props.browsing) return cb([]);
    (new SelectorToken.Collection()).fetch({
      data: {
        scope: this.props.scope.pluck('id'),
        indicies: this.props.indicies,
        q: query
      },
      success: function (selectorTokens) {
        cb(selectorTokens.invoke('toSelectize'));
      },
      error: cb.bind(this, [])
    });
  },

  openBrowse: function () {
    var component = SelectorBrowse.default(this.props);
    (<Olay className='selector-browse' component={component} />).show();
  },

  render: function () {
    return (
      <div className='selector-input'>
        <input ref='input' />
        {
          this.props.browsing ?
          null :
          <span onClick={this.openBrowse}>Browse</span>
        }
      </div>
    );
  }
});
