/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import {getMoment} from 'entities/event';
import React from 'react';
import tz from 'tz';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      tz: tz,
      date: getMoment(void 0, tz).format('YYYY-MM-DD')
    };
  },

  getInitialState: function () {
    return {
      date: getMoment(this.props.date, this.props.tz).format('YYYY-MM-DD')
    };
  },

  getDates: function () {
    var dateMom = getMoment(this.state.date, this.props.tz)
      .startOf('month').startOf('week');
    return _.times(this.props.rows, function () {
      var date = dateMom.format('YYYY-MM-DD');
      dateMom.add('weeks', 1);
      return date;
    });
  },

  handleMonthChange: function (ev) {
    var month = parseInt(ev.target.value);
    var dateMom = getMoment(this.state.date, this.props.tz).month(month);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handleYearChange: function (ev) {
    var year = parseInt(ev.target.value);
    var dateMom = getMoment(this.state.date, this.props.tz).year(year);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handleTodayClick: function () {
    var dateMom = getMoment(void 0, this.props.tz);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handlePrevClick: function () {
    this.incrMonth(-1);
  },

  handleNextClick: function () {
    this.incrMonth(1);
  },

  incrMonth: function (dir) {
    var dateMom = getMoment(this.state.date, this.props.tz).add('month', dir);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  renderMonthOption: function (month) {
    return (
      <option key={month} value={month}>
        {getMoment(this.state.date, this.props.tz).month(month).format('MMMM')}
      </option>
    );
  },

  renderMonthSelect: function () {
    return (
      <div className='osw-month osw-field osw-dropdown'>
        <select
          value={getMoment(this.state.date, this.props.tz).month()}
          onChange={this.handleMonthChange}
        >
          {_.times(12, this.renderMonthOption)}
        </select>
      </div>
    );
  },

  renderYearOption: function (year) {
    return <option key={year}>{year}</option>;
  },

  renderYearSelect: function () {
    var year = getMoment(this.state.date, this.props.tz).year();
    return (
      <div className='osw-year osw-field osw-dropdown'>
        <select value={year} onChange={this.handleYearChange}>
          {_.map(_.range(year - 3, year + 4), this.renderYearOption)}
        </select>
      </div>
    );
  },

  renderDayName: function (n) {
    return (
      <th key={n}>
        <div className='osw-day-name'>
          {getMoment(void 0, this.props.tz).day(n).format('ddd')}
        </div>
      </th>
    );
  },

  renderDayNames: function () {
    return (
      <table className='osw-day-names'>
        <thead>
          <tr>{_.times(7, this.renderDayName)}</tr>
        </thead>
      </table>
    );
  },

  renderWeek: function (date) {
    return (
      <Week
        key={date}
        date={date}
        rows={4}
        events={this.props.events}
        eventFilters={this.props.eventFilters}
        tz={this.props.tz}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-events-calendar'>
        {this.renderMonthSelect()}
        {this.renderYearSelect()}
        <span className='osw-button' onClick={this.handlePrevClick}>
          &lt;
        </span>
        <span className='osw-button' onClick={this.handleTodayClick}>
          Today
        </span>
        <span className='osw-button' onClick={this.handleNextClick}>
          &gt;
        </span>
        {this.renderDayNames()}
        {this.getDates().map(this.renderWeek)}
      </div>
    );
  }
});
