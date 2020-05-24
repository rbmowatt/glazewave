import BaseRequest from './BaseRequest';

class SessionRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/session';
    }
}
export default SessionRequests;