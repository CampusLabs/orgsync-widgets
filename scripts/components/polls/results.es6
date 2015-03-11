import _ from 'underscore';
import React from 'react';

export default React.createClass({
  propTypes: {
    responses: React.PropTypes.array
  },

  getDefaultProps: function() {
    return {
      responses: null
    };
  },

  percentageOfLeader: function(votes, maxWidth) {
    var maxVotes = _.max(this.props.responses, function(response) { return response.votes }).votes;
    return this.calculatePercentage(votes, maxVotes, maxWidth, 5);
  },

  calculatePercentage: function(votes, maxVotes, maxWidth, minWidth) {
    if (votes === 0) {
      return minWidth + "%";
    } else {
      return parseInt(votes / maxVotes * (maxWidth - minWidth) + minWidth) + "%";
    }
  },

  totalVotes: function() {
    return _.reduce(this.props.responses, function(sum, response) { return sum + response.votes }, 0);
  },

  renderResponses: function() {
    var that = this;
    return _.map(this.props.responses, function(response) {
      return (
        <tr key={response.id}>
          <td width="30%">{response.name}</td>
          <td>
            <div className="osw-poll-bar" style={{ width: that.percentageOfLeader(response.votes, 88) }}></div>
            <div className="osw-poll-bar-count">{response.votes}</div>
          </td>
          <td width="7%">{that.calculatePercentage(response.votes, that.totalVotes(), 100, 0)}</td>
        </tr>
      );
    });
  },

  render: function() {
    if (this.props.responses === null) {
      return (
        <p>
          <strong>The results are hidden.</strong>
        </p>
      );
    } else {
      return (
        <table className="osw-poll-results">
          <tbody>
            {this.renderResponses()}
          </tbody>
        </table>
      );
    }
  }
});
