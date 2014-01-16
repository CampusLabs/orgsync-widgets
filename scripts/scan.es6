import $ from 'jquery';
import _ from 'underscore';
import api from 'api';
import elementQuery from 'elementQuery';
import React from 'react';

export default function () {
  $('.orgsync-widget').each(function () {
    var $self = $(this);
    var data = $self.data();
    if (!$self.is(':empty') || !data.name) return;
    var component = require('components/' + data.name).default;
    if (data.apiKey) api.key = data.apiKey;
    if (data.apiUrlRoot) api.urlRoot = data.apiUrlRoot;
    React.renderComponent(component(_.clone(data)), this);
  });
  elementQuery();
}
