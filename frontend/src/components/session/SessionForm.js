import React from 'react';

export const SessionForm = props =>{
    return (
        <form className="row" id="create-post-form" onSubmit={props.processFormSubmission} noValidate={true}>
         <div className="form-group col-md-12">
                <label htmlFor="first_name"> Name/Title </label>
                <input type="text" id="name" defaultValue={props.session.title} onChange={(e) => props.handleInputChanges(e)} name="name" className="form-control" placeholder="Session Title" />
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> What Board Did You Use?
            <select  onChange={(e) => props.handleInputChanges(e)} id="board_id" name="board_id" className="form-control">
                {props.boards.map((obj) => {
                     return <option prop={obj.name} value={obj.id}>{obj.name}</option>
                 })}
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> What would you rate this Session on a scale of 1-10?
                <select value={props.session.rating} onChange={(e) => props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                        {[...Array(11).keys()].map((value, index) => {
                            if(value === 0) return;
                            return  <option value={value}>{value}</option>
                        })}
                </select>
            </label>
        </div>
        <div className="form-group col-md-12">
        <label htmlFor="isPublic"> Should this Session be Public to ALL logged-in Users?
            <select value={props.session.is_public} onChange={(e) => props.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
            <option value="0">Private</option>
            <option value="1">Public</option>
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
                <label htmlFor="first_name"> Notes </label>
                <textarea id="notes" name="notes" className="form-control" onChange={(e) => props.handleInputChanges(e)} />
        </div>
        
        { props.children && 
            <div className="form-group col-md-12">
                { props.children }
            </div>
        }
        <div className="form-group col-md-4 pull-right">
            <button className="btn btn-success" type="submit">
            {(props.edit) ? ("Edit Session") : ( "Add Session") }
            </button>
        </div>
    </form>
    )
}