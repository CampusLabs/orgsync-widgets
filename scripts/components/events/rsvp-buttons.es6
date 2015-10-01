import _ from 'underscore';
import api from 'api';
import Button from 'components/ui/button';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

var STATUS_MAP = {
  Yes: 'Attending',
  Maybe: 'Maybe Attending',
  No: 'Not Attending'
};

var ACTION_MAP = {
  Attending: 'Yes',
  'Added by Admin': 'Yes',
  'Maybe Attending': 'Maybe',
  'Not Attending': 'No'
};

var Section = React.createClass({
  mixins: [Cursors],

  render: function () {
    return (
      <div className='osw-events-show-section'>
        <Icon name={this.props.icon} />
        <div className='osw-events-show-section-main'>
          {this.props.children}
        </div>
      </div>
    );
  }
});

export default React.createClass({

  renderRSVPIcon: function (icon) {
    if (!icon) return;
    return <Icon name='check' />;
  },

  renderAttendees: function () {
    console.log(this.state.event);
    var event = this.state.event;
    var sample = event.attendees_sample;
    if (!_.size(sample)) return;
    var more = event.total_attendees - sample.length;
    return (
      <div className='osw-events-show-attendees'>
        {event.attendees_sample.map(this.renderAttendee)}
        {
          more ?
          <div>
            <a href={event.links.web} target='_parent'>And {more} more...</a>
          </div> :
          null
        }
      </div>
    );
  },

  setRsvp: function (status) {
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.post(this.state.event.links.rsvp, {status: status}, this.handleFetch);
  },

  renderRsvpAction: function () {
    var actions = this.state.event.rsvp_actions;
    var event = this.state.event;
    if (!_.size(actions)) return;
    var buttons;

    if (actions[0] === 'Register') {
      buttons =
        <Button href={event.pre_event_form} target='_parent'>
          Yes, Register Now
        </Button>;
    } else {
      var userAction = ACTION_MAP[event.rsvp];
      buttons = actions.map(function (action) {
        return (
          <Button onClick={_.partial(this.setRsvp, STATUS_MAP[action])}>
            {this.renderRSVPIcon(action == userAction)} {action}
          </Button>
        );
      }, this);
    }

    return (
      <div className='osw-events-show-rsvp-action'>
        <strong>Will you be attending?</strong>
        {
          buttons ?
          <div className='osw-events-show-actions'>{buttons}</div> :
          null
        }
      </div>
    );
  },

  render: function () {
    var attendees = this.renderAttendees();
    var rsvpAction = this.renderRsvpAction();
    var message = this.state.event.rsvp_message;
    if (message) message = <div>{message}</div>;
    if (!_.any([attendees, rsvpAction, message])) return <div></div>;
    return (
      <Section icon='rsvp'>
        {attendees}
        {rsvpAction}
        {message}
      </Section>
    );
  }
});
