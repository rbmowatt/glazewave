import BaseRequest from './BaseRequest';

class SessionRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/session';
    }

    getImages = (args) => {
        this.endpoint = '/api/session/images';
        return this.get(args);

    }
}
export default SessionRequests;