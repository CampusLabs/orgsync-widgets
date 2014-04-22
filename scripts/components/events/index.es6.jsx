/** @jsx React.DOM */

module Community from 'entities/community';
module EventDay from 'entities/event-day';
module Event from 'entities/event';
import List from 'components/list';
module Portal from 'entities/portal';
import React from 'react';
import tz from 'tz';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      events: {
        type: Portal.Collection,
        alternates: {
          communityId:
            (new Community.Model({id: this.props.communityId})).get('events'),
          portalId: (new Portal.Model({id: this.props.id})).get('events')
        }
      }
    };
  },

  getDefaultProps: function () {
    var events = new Event.Collection();
    events.url = '/accounts/events';
    return {
      events: events,
      tz: tz
    };
  },

  componentWillMount: function () {
    this.eventDays = new EventDay.Collection();
    this.eventDays.tz = this.props.tz;
  },

  renderEventDay: function (day, n) {
    var start = day.date();
    if (start.date() !== 0) return;
    return (
      <Week
        start={start}
        rows={4}
        eventDays={this.eventDays}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-events-index'>
        <List
          collection={this.eventDays}
          renderListItem={this.renderEventDay}
        />
      </div>
    );
  }
});
