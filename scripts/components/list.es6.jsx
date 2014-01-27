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
      renderPageSize: 10,
      fetchPageSize: 20,
      threshold: 500,
      shouldFetch: true,
      renderLoading: function () { return <div>Loading...</div>; },
      renderError: function (er) { return <div>{er}</div>; },
      renderBlankSlate: function () { return <div>No items to show.</div>; }
    };
  },

  getInitialState: function () {
    return {
      isLoading: this.props.isLoading,
      error: this.props.error,
      models: []
    };
  },

  componentWillMount: function () {
    this.doneFetching = !this.props.shouldFetch;
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState({
      isLoading:
        'isLoading' in nextProps ? nextProps.isLoading : this.state.isLoading,
      error: 'error' in nextProps ? nextProps.error : this.state.error,
      models: []
    });
  },

  componentDidMount: function () {
    this.$scrollParent().on('scroll', this.renderNextPage);
    $(window).on('resize', this.renderNextPage);
    this.renderNextPage();
  },

  componentDidUpdate: function () {this.renderNextPage(); },

  componentWillUnmount: function () {
    this.$scrollParent().off('scroll', this.renderNextPage);
    $(window).off('resize', this.renderNextPage);
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

  needsPage: function () {
    var $el = $(this.getDOMNode());
    var $scrollParent = this.$scrollParent();
    var isWindow = $scrollParent[0] === window;
    var aH = $scrollParent.height();
    var scrollTop = (isWindow ? $(document) : $scrollParent).scrollTop();
    var bY = $el[isWindow ? 'offset' : 'position']().top;
    var bH = $el.prop('scrollHeight');
    var threshold = this.props.threshold;
    return aH + scrollTop > bY + bH - threshold;
  },

  renderPage: function () {
    return 1 + Math.floor(this.state.models.length / this.props.renderPageSize);
  },

  fetchPage: function () {
    return 1 + Math.floor(
      this.props.collection.length / this.props.fetchPageSize
    );
  },

  renderNextPage: function () {
    if (!this.needsPage()) return;
    var length = this.renderPage() * this.props.renderPageSize;
    var collection = this.props.collection;
    if (this.state.models.length < collection.length) {
      this.setState({models: collection.models.slice(0, length)});
    }
    if (length < collection.length) return;
    this.fetchNextPage();
  },

  fetchNextPage: function () {
    if (this.doneFetching || this.state.isLoading || this.state.error) return;
    this.setState({isLoading: true, error: null});
    this.props.collection.fetch({
      remove: false,
      data: _.extend({
        page: this.fetchPage(),
        per_page: this.props.fetchPageSize
      }, this.props.fetchOptions)
    });
  },

  onSuccess: function (collection, data) {
    if (data.length < this.props.fetchPageSize) this.doneFetching = true;
    this.setState({isLoading: false, error: null});
  },

  onError: function (collection, er) {
    this.setState({isLoading: false, error: er.toString()});
  },

  renderFetchMessage: function () {
    if (this.state.isLoading) return this.props.renderLoading();
    if (this.state.error) return this.props.renderError(this.state.error);
    if (!this.state.models.length) return this.props.renderBlankSlate();
  },

  render: function () {
    return this.transferPropsTo(
      <div>
        {this.state.models.map(this.props.renderListItem)}
        {this.renderFetchMessage()}
      </div>
    );
  }
});
