/** @jsx React.DOM */

import $ from 'jquery';
import Selectize from 'selectize';
import AccountsListItem from 'components/accounts/list-item';
import CoercedPropsMixin from 'mixins/coerced-props';
import ListenersMixin from 'mixins/listeners';
import List from 'components/list';
module SelectorToken from 'entities/selector-token';
import React from 'react';

export default React.createClass({
  mixins: [CoercedPropsMixin, ListenersMixin],

  getCoercedProps: function () {
    return {
      value: {type: SelectorToken.Collection}
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
      allowMultiple: true,
      maxItems: Infinity,
      scope: []
    };
  },

  componentDidMount: function () {
    window.blah = this;
    var input = this.refs.input.getDOMNode();

    // Initialize Selectize.
    $(input).selectize({
      create: this.createItem,
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
    this.props.value.add(JSON.parse(val), {at: i});
  },

  onItemRemove: function (val) {
    var data = JSON.parse(val);
    var value = this.props.value;
    if (data.id) return value.remove(data.id);
    value.remove(value.findWhere({name: data.name}));
  },

  addItem: function (selectorToken) {
    var data = this.createItem(selectorToken.attributes);
    var input = this.refs.input.getDOMNode();
    var i = this.props.value.indexOf(selectorToken);
    input.selectize.addOption(data);
    input.selectize.setCaret(i);
    input.selectize.addItem(data.value);
    input.selectize.setCaret(i + 1);
  },

  removeItem: function (selectorToken) {
    var data = this.createItem(selectorToken.attributes);
    var input = this.refs.input.getDOMNode();
    input.selectize.removeItem(data.value);
  },

  createItem: function (data) {
    var initialItem = typeof data === 'object';
    if (!this.props.allowArbitrary && !initialItem) return;
    if (!initialItem) data = {name: data};
    return {value: JSON.stringify(data), text: data.name};
  },

  fetch: function (query, cb) {
    // this.createItem(query);
    cb([]);
  },

  render: function () {
    return (
      <div className='selector-input'>
        <input ref='input' />
      </div>
    );
  }
});
