import BaseRequest from './BaseRequest';

class UserRequests extends BaseRequest{
    REQUEST_TYPE = 'USER';

    constructor( session ){
        super(session);
        this.endpoint = '/api/user';
    }
}
export default UserRequests;