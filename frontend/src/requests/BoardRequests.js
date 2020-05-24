import BaseRequest from './BaseRequest';

class BoardRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/board';
    }
}
export default BoardRequests;