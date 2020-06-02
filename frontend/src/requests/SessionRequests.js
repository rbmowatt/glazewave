import BaseRequest from './BaseRequest';

class SessionRequests extends BaseRequest{

    REQUEST_TYPE = 'SESSION';

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