import $ from 'jquery';
import _ from 'underscore';
import elementQuery from 'elementQuery';
import React from 'react';

export default function () {
  $('.orgsync-widget').each(function () {
    var $self = $(this);
    var data = $self.data();
    if (!$self.is(':empty') || !data.name) return;
    var component = require('components/' + data.name).default;
    React.renderComponent(component(_.clone(data)), this);
  });
  elementQuery();
}
