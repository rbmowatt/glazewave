import BaseRequest from './BaseRequest';

class UserBoardRequests extends BaseRequest{
    REQUEST_TYPE = 'USER_BOARD';
    constructor( session ){
        super(session);
        this.endpoint = '/api/user_board';
    }


    getImages = (args) => {
        this.endpoint = '/api/user_board/images';
        return this.get(args);

    }

    createImages = (args) => {
        this.endpoint = '/api/user_board/images';
        return this.create(args);
    }

    deleteImage = (args) => {
        this.endpoint = '/api/user_board/images';
        return this.delete(args);
    }
}
export default UserBoardRequests;