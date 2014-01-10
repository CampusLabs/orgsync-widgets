import config from 'config';
import OrgSyncApi from 'orgsync-javascript-api';

var api = new OrgSyncApi(config.api);

export default api;
