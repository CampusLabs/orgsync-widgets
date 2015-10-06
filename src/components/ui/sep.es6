import React from 'react';

export default React.createClass({
  render: function () {
    return <span dangerouslySetInnerHTML={{__html: ' &#x2022; '}} />;
  }
});
