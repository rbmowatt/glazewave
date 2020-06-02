import BaseRequest from './BaseRequest';

class ManufacturerRequests extends BaseRequest{
    REQUEST_TYPE = 'MANUFACTURER';
    constructor( session ){
        super(session);
        this.endpoint = '/api/manufacturer';
    }
}
export default ManufacturerRequests;