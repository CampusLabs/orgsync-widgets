import Cursors from 'cursors';
import React from 'react';

const SRC = 'data:image/gif;base64,R0lGODlhKwALAPEAAP///319fQAAAAAAACH/C05FV' +
            'FNDQVBFMi4wAwEAAAAh+QQFCgAAACwAAAAAKwALAAACMkSOCMuW2diD88UKG95W' +
            '88uF4DaGWFmhZid93pq+pwxnLUnXh8ou+sSz+T64YCAyTBUAACH5BAUKAAEALAA' +
            'AAAALAAsAAAIMDI5oye0Po5yULhcKACH5BAUKAAIALAAAAAAbAAsAAAIrVI4oyw' +
            'IPoUk0NBczqPTqzCXeB4VKQ5amhabbOqYry7ivGZNz/k3ctUgJCgAh+QQFCgACA' +
            'CwQAAAAGwALAAACK1SOKMsCD6FJNDQXM6j06swl3geFSkOWpoWm2zqmK8u4rxmT' +
            'c/5N3LVICQoAOw==';

export default React.createClass({
  mixins: [Cursors],

  render() {
    return <img src={SRC} style={{width: 21, height: 5}}/>;
  }
});
