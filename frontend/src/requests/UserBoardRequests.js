import BaseRequest from './BaseRequest';

class UserBoardRequests extends BaseRequest{
    REQUEST_TYPE = 'USER_BOARD';
    constructor( session ){
        super(session);
        this.endpoint = '/api/user_board';
    }
}
export default UserBoardRequests;