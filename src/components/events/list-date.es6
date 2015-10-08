import {Mixin} from 'cursors';
import FetchList from 'components/ui/fetch-list';
import ListItem from 'components/events/list-item';
import React from 'react';

import {getMoment} from 'entities/event';

var PREFIX_RE = /^(Yesterday|Today|Tomorrow)/;

export default React.createClass({
  mixins: [Mixin],

  renderEvent: function (event) {
    var i = this.state.allEvents.indexOf(event);
    return (
      <ListItem
        key={event.id}
        date={this.props.date}
        eventFilters={this.props.eventFilters}
        redirect={this.props.redirect}
        portalId={this.props.portalId}
        tz={this.props.tz}
        cursors={{event: this.getCursor('allEvents', i)}}
      />
    );
  },

  renderEmpty: function () {
    return <div className='osw-blank-slate-message'>There are no events to show.</div>;
  },

  render: function () {
    var date = this.props.date;
    var dateMom = getMoment(date, this.props.tz);
    var prefix = PREFIX_RE.exec(dateMom.calendar()) || '';
    if (prefix) prefix = prefix[0] + ', ';
    return (
      <div className='osw-events-list-date'>
        <div className='osw-events-list-date-header'>
          {prefix + dateMom.format('dddd, MMMM D, YYYY')}
        </div>
        <FetchList
          emptyRenderer={this.renderEmpty}
          itemRenderer={this.renderEvent}
          items={this.props.events}
          type='uniform'
        />
      </div>
    );
  }
});
