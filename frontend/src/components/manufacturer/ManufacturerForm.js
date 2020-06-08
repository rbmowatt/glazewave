import React from 'react';

export const ManufacturerForm = props =>{
    return (
        <form className="row" id="create-post-form" onSubmit={props.processFormSubmission} noValidate={true}>
        <div className="form-group col-md-12">
            <label htmlFor="model"> Name </label>
            <input type="text" id="name" defaultValue={props.manufacturer.name} onChange={(e) => props.handleInputChanges(e)} name="name" className="form-control" placeholder="Manufacturer Name" />
        </div>
        { props.children && 
            <div className="form-group col-md-12">
                { props.children }
            </div>
        }
        <div className="form-group col-md-4 pull-right">
            <button className="btn btn-success" type="submit">
            {(props.edit) ? ("Edit Manufacturer") : ( "Add Manufacturer") }
            </button>
        </div>
    </form>
    )
}