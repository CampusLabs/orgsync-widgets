import $ from 'jquery';
import elementQuery from 'elementQuery';
import React from 'react';

export default function () {
  $('.orgsync-widget').each(function () {
    var $self = $(this);
    var data = $self.data();
    if (!$self.empty() || !data.name) return;
    try {
      var component = require('components/' + data.name).default;
      React.renderComponent(component(data), this);
    } catch (er) {
      console.warn('OrgSync Widget "' + data.name + '" could not be found.');
    }
  });
  elementQuery();
}
