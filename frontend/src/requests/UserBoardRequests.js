import BaseRequest from './BaseRequest';

class UserBoardRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/user_board';
    }
}
export default UserBoardRequests;