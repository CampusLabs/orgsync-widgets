import React from 'react';

export default React.createClass({
  render: function() {
    return (
      <table className="osw-poll-results">
        <tbody>
          <tr>
            <td width="30%">For the new SGA Constitution</td>
            <td>
              <div className="osw-poll-bar" style={{ width: "88%" }}></div>
              <div className="osw-poll-bar-count">7</div>
            </td>
            <td width="7%">77%</td>
          </tr>
          <tr>
            <td width="30%">Against the new SGA constitution.</td>
            <td>
              <div className="osw-poll-bar" style={{ width: "25%" }}></div>
              <div className="osw-poll-bar-count">2</div>
            </td>
            <td width="7%">22%</td>
          </tr>
          <tr>
            <td colSpan={2} className="osw-polls-text-right">
              <strong>Total Votes</strong>
            </td>
            <td>
              <strong>9</strong>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
});
