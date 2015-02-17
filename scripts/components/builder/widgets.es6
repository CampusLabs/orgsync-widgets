export default {
  Albums: {
    moduleName: 'albums/index',
    props: ['portalId']
  },
  Events: {
    moduleName: 'events/index',
    props: [
      'communityId',
      'portalId',
      'view',
      'lockView',
      'tz',
      'activeEventFilterIds'
    ]
  },
  Files: {
    moduleName: 'files/index',
    props: [
      'portalId'
    ]
  },
  News: {
    moduleName: 'news-posts/index',
    props: [
      'portalId',
      'truncateLength',
      'redirect'
    ]
  },
  Portals: {
    moduleName: 'portals/index',
    props: [
      'communityId',
      'umbrella',
      'category',
      'letter',
      'filtersAreShowing',
      'redirect'
    ]
  },
  Selector: {
    moduleName: 'selector/index',
    props: [
      'allowArbitrary',
      'allowEmptyQuery',
      'allowBrowse',
      'browseText',
      'limit',
      'scopes',
      'value',
      'types',
      'boostTypes',
      'view',
      'dataset'
    ]
  }
};
