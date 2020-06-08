import React from 'react';

export const UserForm = props =>{
    const addPhonePrefix = e =>
    {   
        e.persist();
        const validKeys = [8, 37, 39];
        if( validKeys.indexOf(e.keyCode) === -1 && (e.currentTarget.value.length > 11 || (!Number.isInteger(parseInt(e.key)))))
        {
            e.preventDefault();
            return;
        }
        let currentValue = e.currentTarget.value;
        let target = e.currentTarget;
        let key = e.key;
        setTimeout(function () {
            if(target.value !== '' && currentValue.indexOf('+1') !== 0) {
                target.value = '+1' + key;
            } 
        }, 1);
    }
    return (
        <form className="row" id={"create-post-form"} onSubmit={props.processFormSubmission} noValidate={true}>
        <div className="form-group col-md-12">
                <label htmlFor="Username"> User Name </label>
                <input disabled={props.edit ? "disabled" : false} type="text" id="Username" defaultValue={ (props.edit && props.user.Username) || ''} onChange={(e) => props.handleInputChanges(e)} name="Username" className="form-control" placeholder="Enter a Username for the user" />
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="name"> Name </label>
                <input type="text" id="name" defaultValue={(props.edit && props.user.name) || ''} onChange={(e) => props.handleInputChanges(e)} name="name" className="form-control" placeholder="Enter user's first name" />
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="email"> Email </label>
                <input type="email" id="email" defaultValue={(props.edit && props.user.email) || ''} onChange={(e) => props.handleInputChanges(e)} name="email" className="form-control" placeholder="Enter user's email address" />
            </div>

            <div className="form-group col-md-12">
                <label htmlFor="phone"> Phone </label>
                <input type="text" id="phone_number" defaultValue={(props.edit && props.user.phone_number) || ''} onKeyDown={(e)=> addPhonePrefix(e)} onChange={(e) => props.handleInputChanges(e)} name="phone_number" className="form-control" placeholder="+[d]1234567890" />
            </div>

            <div className="form-group col-md-4 pull-right">
                <button className="btn btn-success" type="submit">
                    {(props.edit) ? ("Edit User") : ( "Add User") }</button>
                {props.loading &&
                    <span className="fa fa-circle-o-notch fa-spin" />
                }
            </div>
        </form>)
        ;
}