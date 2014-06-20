/** @jsx React.DOM */

import $ from 'jquery';
import _ from 'underscore';
import animationFrame from 'animation-frame';
import React from 'react/addons';

export default React.createClass({
  getDefaultProps: function () {
    return {
      isLoading: false,
      error: null,
      renderPageSize: 10,
      threshold: 500,
      uniform: false,
      component: React.DOM.div,
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
    this.isDoneFetching = !this.props.fetch;
    if (this.props.fetchInitially) this.fetchPage();
  },

  componentDidMount: function () {
    this.get$ScrollParent().on('scroll', this.delayUpdate);
    $(window).on('resize', this.delayUpdate);
    this.update();
  },

  componentWillUnmount: function () {
    this.get$ScrollParent().off('scroll', this.delayUpdate);
    $(window).off('resize', this.delayUpdate);
  },

  delayUpdate: function () {
    if (this.pendingUpdate) return;
    this.pendingUpdate = true;
    animationFrame.request(this.update);
  },

  // Get scroll position relative to the top of the list.
  getScroll: function () {
    var $scrollParent = this.get$ScrollParent();
    var $el = $(this.getDOMNode());
    if ($scrollParent[0] === $el[0]) {
      return $scrollParent.scrollTop();
    } else if ($scrollParent[0] === window) {
      return $(document).scrollTop() - $el.offset().top;
    } else {
      return $scrollParent.scrollTop() - $el.position().top;
    }
  },

  // REFACTOR
  update: function () {
    if (!this.isMounted()) return;

    this.pendingUpdate = false;

    var items = this.props.items;
    var uniform = this.props.uniform;
    var $scrollParent = this.get$ScrollParent();
    var $el = $(this.getDOMNode());

    var scroll = this.getScroll();

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
        if (columns !== this.state.columns) this.delayUpdate();
        rows = Math.ceil($scrollParent.innerHeight() / itemHeight);

        var rowThreshold = Math.ceil(this.props.threshold / itemHeight);

        length = columns * (rows + rowThreshold * 2);
        index = Math.max(
          0,
          Math.min(
            (items.length + columns) - (items.length % columns) - length,
            (Math.floor(scroll / itemHeight) - rowThreshold) * columns
          )
        );
      } else {
        length = this.props.renderPageSize;
        if (items.length) this.delayUpdate();
      }
    } else if (length <= items.length) {
      var listBottom = $el.prop('scrollHeight') - this.props.threshold;
      var visibleBottom = scroll + $scrollParent.height();
      if (listBottom < visibleBottom) {
        length += this.props.renderPageSize;
        this.delayUpdate();
      }
    }

    // Fetch if the models in memory have been exhausted.
    if (index + length > items.length) this.fetchPage();

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

  get$ScrollParent: function () {
    if (this._$scrollParent) return this._$scrollParent;
    var el = this.getDOMNode();
    var parents = [el].concat($(el).parents().toArray());
    return this._$scrollParent = $(_.find(parents, function (parent) {
      var overflowY = $(parent).css('overflow-y');
      return overflowY === 'auto' || overflowY === 'scroll';
    }) || window);
  },

  fetchPage: function () {
    if (this.isDoneFetching || this.state.isLoading || this.state.error) return;
    this.setState({isLoading: true, error: null});
    this.props.fetch(this.props.items, this.handleFetchResult);
  },

  handleFetchResult: function (er, isDone) {
    if (!er && isDone) this.isDoneFetching = true;
    this.setState({isLoading: false, error: er});
  },

  scrollTo: function (item) {
    var items = this.props.items;
    var targetIndex = _.indexOf(items, item);
    if (targetIndex === -1) return;
    var $scrollParent = this.get$ScrollParent();
    var itemHeight = this.state.itemHeight;
    var current = this.getScroll();
    var max = Math.floor(targetIndex / this.state.columns) * itemHeight;
    var min = max - $scrollParent.innerHeight() + itemHeight;
    if (current > max) return $scrollParent.scrollTop(max);
    if (current < min) $scrollParent.scrollTop(min);
  },

  renderSpace: function (n) {
    if (!this.props.uniform || !this.state.columns) return;
    var height = (n / this.state.columns) * this.state.itemHeight;
    return <div style={{height: height}} />;
  },

  renderSpaceAbove: function () {
    return this.renderSpace(this.state.index);
  },

  renderSpaceBelow: function () {
    var n = this.props.items.length - this.state.index - this.state.length;
    return this.renderSpace(Math.max(0, n));
  },

  renderListItems: function () {
    var listItems = this.props.items
      .slice(this.state.index, this.state.index + this.state.length)
      .map(this.props.renderListItem);
    return <div ref='listItems'>{listItems}</div>;
  },

  renderFetchMessage: function () {
    var info = this.props.fetch ? this.state : this.props;
    if (info.isLoading) return this.props.renderLoading();
    if (info.error) return this.props.renderError(info.error);
    if (!this.props.items.length) return this.props.renderBlankSlate();
  },

  render: function () {
    var Component = this.props.component;
    return this.transferPropsTo(
      <Component>
        {this.renderSpaceAbove()}
        {this.renderListItems()}
        {this.renderSpaceBelow()}
        {this.renderFetchMessage()}
      </Component>
    );
  }
});
