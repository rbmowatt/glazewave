import React from 'react';

export const BoardForm = props =>{
    console.log('mfg', props.manufacturers);
    return (
        <form className="row" id="create-post-form" onSubmit={props.processFormSubmission} noValidate={true}>
        <div className="form-group col-md-12">
            <label htmlFor="model">Name</label>
            <input type="text" id="model" defaultValue={props.board.model} onChange={(e) => props.handleInputChanges(e)} name="model" className="form-control" placeholder="Give your Board a Nickname" />
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> Manufacturer/Shaper
            <select  onChange={(e) => props.handleInputChanges(e)} id="manufacturer_id" name="manufacturer_id" className="form-control">
                {props.manufacturers.map((obj) => {
                     return <option prop={obj.name} value={obj.id}>{obj.name}</option>
                 })}
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> Model
            <select  onChange={(e) => props.handleInputChanges(e)} id="manufacturer_id" name="manufacturer_id" className="form-control">
                {props.models.map((obj) => {
                     return <option prop={obj.model} value={obj.id}>{obj.model}</option>
                 })}
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> What would you rate this Board on a scale of 1-10?
            <select value={props.board.rating} onChange={(e) => props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
        <label htmlFor="isPublic"> Should this Board be Public to ALL logged-in Users?
            <select value={props.board.is_public} onChange={(e) => props.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
            <option value="0">Private</option>
            <option value="1">Public</option>
            </select>
            </label>
        </div>
        { props.children && 
            <div className="form-group col-md-12">
                { props.children }
            </div>
        }
        <div className="form-group col-md-4 pull-right">
            <button className="btn btn-success" type="submit">
            {(props.edit) ? ("Edit Board") : ( "Add Board") }
            </button>
        </div>
    </form>
    )
}