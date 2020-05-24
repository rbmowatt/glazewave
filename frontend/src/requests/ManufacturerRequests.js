import BaseRequest from './BaseRequest';

class ManufacturerRequests extends BaseRequest{
    constructor( session ){
        super(session);
        this.endpoint = '/api/manufacturer';
    }
}
export default ManufacturerRequests;