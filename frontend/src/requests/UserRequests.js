import BaseRequest from './BaseRequest';

class UserRequests extends BaseRequest{
    REQUEST_TYPE = 'USER';

    constructor( session ){
        super(session);
        this.endpoint = '/api/user';
    }

    updateProfileImage = (args) => {
        this.endpoint = '/api/user/images';
        return this.create(args);
    }
}
export default UserRequests;