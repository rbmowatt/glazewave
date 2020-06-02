import BaseRequest from './BaseRequest';

class BoardRequests extends BaseRequest{
    REQUEST_TYPE = 'BOARD';
    constructor( session ){
        super(session);
        this.endpoint = '/api/board';
    }
}
export default BoardRequests;