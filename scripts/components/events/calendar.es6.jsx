/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import {mom} from 'entities/event';
import React from 'react';
import tz from 'tz';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      tz: tz,
      date: mom(void 0, tz).format('YYYY-MM-DD')
    };
  },

  getInitialState: function () {
    return {
      date: mom(this.props.date, this.props.tz).format('YYYY-MM-DD')
    };
  },


  getDates: function () {
    var dateMom = mom(this.state.date, this.props.tz)
      .startOf('month').startOf('week');
    return _.times(this.props.rows, function () {
      var date = dateMom.format('YYYY-MM-DD');
      dateMom.add('weeks', 1);
      return date;
    });
  },

  handleMonthChange: function (ev) {
    var month = parseInt(ev.target.value);
    var dateMom = mom(this.state.date, this.state.tz).month(month);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handleYearChange: function (ev) {
    var year = parseInt(ev.target.value);
    var dateMom = mom(this.state.date, this.state.tz).year(year);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  renderMonthOption: function (month) {
    return (
      <option key={month} value={month}>
        {mom(this.state.date, this.state.tz).month(month).format('MMMM')}
      </option>
    );
  },

  renderMonthSelect: function () {
    return (
      <select
        value={mom(this.state.date, this.state.tz).month()}
        onChange={this.handleMonthChange}
      >
        {_.times(12, this.renderMonthOption)}
      </select>
    );
  },

  renderYearOption: function (year) {
    return <option key={year}>{year}</option>;
  },

  renderYearSelect: function () {
    var year = mom(this.state.date, this.state.tz).year();
    return (
      <select value={year} onChange={this.handleYearChange}>
        {_.map(_.range(year - 3, year + 4), this.renderYearOption)}
      </select>
    );
  },

  renderDayName: function (n) {
    return (
      <th key={n}>
        <div className='osw-day-name'>
          {mom(void 0, this.props.tz).day(n).format('ddd')}
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
        {this.renderDayNames()}
        {this.getDates().map(this.renderWeek)}
      </div>
    );
  }
});
