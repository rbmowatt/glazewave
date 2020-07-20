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

    getAverages = ({ id = null, withs = [], label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url :this.getEndpoint() + `/` + id+ `/average?` + this.getWithString(withs),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label
        });
    }
}
export default UserRequests;