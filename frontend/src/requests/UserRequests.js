import BaseRequest from './BaseRequest';

class UserRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/user';
    }
}
export default UserRequests;