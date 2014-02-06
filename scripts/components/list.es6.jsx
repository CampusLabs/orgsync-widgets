/** @jsx React.DOM */

import $ from 'jquery';
import _ from 'underscore';
import ListenersMixin from 'mixins/listeners';
import React from 'react';

export default React.createClass({
  mixins: [ListenersMixin],

  getListeners: function () {
    return [{
      model: this.props.collection,
      events: {
        sync: this.onSuccess,
        error: this.onError
      }
    }];
  },

  getDefaultProps: function () {
    return {
      isLoading: false,
      error: null,
      fetchPageSize: 20,
      renderPageSize: 1,
      shouldFetch: true,
      threshold: 500,
      uniform: false,
      renderLoading: function () { return <div>Loading...</div>; },
      renderError: function (er) { return <div>{er}</div>; },
      renderBlankSlate: function () { return <div>No items to show.</div>; }
    };
  },

  getInitialState: function () {
    return {
      isLoading: this.props.isLoading,
      error: this.props.error,
      index: 0,
      length: 0,
      itemWidth: 0,
      itemHeight: 0,
      columns: 0,
      rows: 0
    };
  },

  componentWillMount: function () {
    this.doneFetching = !this.props.shouldFetch;
  },

  componentDidMount: function () {
    this.$scrollParent().on('scroll', this.delayedUpdate);
    $(window).on('resize', this.delayedUpdate);
    this.update();
  },

  componentWillUnmount: function () {
    this.$scrollParent().off('scroll', this.delayedUpdate);
    $(window).off('resize', this.delayedUpdate);
  },

  delayedUpdate: function () {
    window.requestAnimationFrame(this.update);
  },

  // REFACTOR
  update: function () {
    var collection = this.props.collection;
    var uniform = this.props.uniform;
    var $scrollParent = this.$scrollParent();
    var $el = $(this.getDOMNode());

    var scroll =
      $scrollParent[0] === window ?
      $(document).scrollTop() - $el.offset().top :
      $scrollParent.scrollTop() - $el.position().top;

    var itemWidth = this.state.itemWidth;
    var itemHeight = this.state.itemHeight;
    var columns = this.state.columns;
    var rows = this.state.rows;
    var index = this.state.index;
    var length = this.state.length;
    if (uniform) {

      // Grab the listItem elements.
      var listItems = this.refs.listItems.getDOMNode().children;

      // Set itemWidth and itemHeight based on the first item.
      if (listItems.length) {
        itemWidth = listItems[0].offsetWidth;
        itemHeight = listItems[0].offsetHeight;

        columns = _.reduce(listItems, function (data, listItem) {
          if (data.top == null) data.top = listItem.offsetTop;
          else if (data.top === listItem.offsetTop) ++data.count;
          return data;
        }, {count: 1}).count;
        if (columns !== this.state.columns) this.delayedUpdate();
        rows = Math.ceil($scrollParent.innerHeight() / itemHeight);

        var rowThreshold = Math.ceil(this.props.threshold / itemHeight);

        length = columns * (rows + rowThreshold * 2);
        index = Math.max(
          0,
          Math.min(
            (collection.length + columns) - (collection.length % columns) - length,
            (Math.floor(scroll / itemHeight) - rowThreshold) * columns
          )
        );
      } else {
        length = 1;
        if (collection.length) this.delayedUpdate();
      }
    } else if (length <= collection.length) {
      var visibleBottom = scroll + $scrollParent.height();
      var actualBottom = $el.prop('scrollHeight') - this.props.threshold;
      if (visibleBottom < actualBottom - this.props.threshold) return;
      length = length + this.props.renderPageSize;
      this.delayedUpdate();
    }

    // Fetch if the models in memory have been exhausted.
    if (index + length > collection.length) this.fetchNextPage();

    // Finally, set the new state.
    this.setState({
      itemWidth: itemWidth,
      itemHeight: itemHeight,
      columns: columns,
      rows: rows,
      index: index,
      length: length
    });
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) ||
      !_.isEqual(this.state, nextState);
  },

  $scrollParent: function () {
    if (this._$scrollParent) return this._$scrollParent;
    var el = this.getDOMNode();
    var parents = [el].concat($(el).parents().toArray());
    return this._$scrollParent = $(_.find(parents, function (parent) {
      var overflowY = $(parent).css('overflow-y');
      return overflowY === 'auto' || overflowY === 'scroll';
    }) || window);
  },

  fetchNextPage: function () {
    if (this.doneFetching || this.state.isLoading || this.state.error) return;
    this.setState({isLoading: true, error: null});
    var collection = this.props.collection;
    var fetchPageSize = this.props.fetchPageSize;
    collection.fetch({
      remove: false,
      data: _.extend({
        page: 1 + Math.floor(collection.length / fetchPageSize),
        per_page: fetchPageSize
      }, _.result(this.props, 'fetchOptions'))
    });
  },

  onSuccess: function (collection, data) {
    if (data.length < this.props.fetchPageSize) this.doneFetching = true;
    this.delayedUpdate();
    this.setState({isLoading: false, error: null});
  },

  onError: function (collection, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  spaceAbove: function () {
    return this.props.uniform ?
      (this.state.index / this.state.columns) * this.state.itemHeight :
      0;
  },

  spaceBelow: function () {
    return this.props.uniform ?
      Math.max(
        0,
        (this.props.collection.length - this.state.index - this.state.length) /
        this.state.columns
      ) * this.state.itemHeight :
      0;
  },

  renderListItems: function () {
    var listItems = this.props.collection
      .slice(this.state.index, this.state.index + this.state.length)
      .map(this.props.renderListItem);
    return <div ref='listItems'>{listItems}</div>;
  },

  renderFetchMessage: function () {
    var info = this.props.shouldFetch ? this.state : this.props;
    if (info.isLoading) return this.props.renderLoading();
    if (info.error) return this.props.renderError(info.error);
    if (!this.props.collection.length) return this.props.renderBlankSlate();
  },

  render: function () {
    return this.transferPropsTo(
      <div>
        <div style={{height: this.spaceAbove()}} />
        {this.renderListItems()}
        <div style={{height: this.spaceBelow()}} />
        {this.renderFetchMessage()}
      </div>
    );
  }
});
