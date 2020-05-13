import React from 'react';

export const RecipeForm = props =>{
    const isPublic = (props.recipe.isPublic === true ) ? 1 : 0;
    return (
        <form className="row" id="create-post-form" onSubmit={props.processFormSubmission} noValidate={true}>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> What would you rate this Recipe on a scale of 1-10?
            <select value={props.recipe.rating} onChange={(e) => props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
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
        <label htmlFor="is_public"> Should this Recipe be Public to ALL logged-in Users?
            <select value={isPublic} onChange={(e) => props.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
            <option value="0">Private</option>
            <option value="1">Public</option>
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="first_name"> Name/Title </label>
            <input type="text" id="name" defaultValue={props.recipe.name} onChange={(e) => props.handleInputChanges(e)} name="name" className="form-control" placeholder="Recipe Title" />
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="recipe"> Recipe </label>
            <textarea id="recipe" defaultValue={props.recipe.recipe} onChange={(e) => props.handleInputChanges(e)} name="recipe" className="form-control" placeholder="Enter the Recipe Here!!" />
        </div>
        { props.children && <div className="form-group col-md-12">
            { props.children }
        </div>
        }
        <div className="form-group col-md-4 pull-right">
            <button className="btn btn-success" type="submit">
            {(props.edit) ? ("Edit Recipe") : ( "Add Recipe") }
            </button>
           
        </div>
    </form>
    )
}