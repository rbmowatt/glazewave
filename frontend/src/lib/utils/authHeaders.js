import TokenStorage from './token_storage';

/*
Only the components that call axios directly need this. Everything routed
through middleware/api.js already gets the header from the same place.

They were passing session.headers, which formatSessionObject never sets, so
axios received undefined and sent no Authorization at all. That was invisible
until POST, PUT and DELETE on /api/user stopped answering to anonymous callers.
*/
const authHeaders = () => ({
	headers: { Authorization: `Bearer ${TokenStorage.getAccessToken()}` },
});

export default authHeaders;
