import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import StarBar from './../layout/StarBar';

class RecipeRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.recipe.id}>
                <div className="col-6">
                <a href="#" onClick={() => this.props.viewRecipe(this.props.recipe.id)}>{this.props.recipe.name}</a>
                </div>
                <div className="col-3">
                {this.props.recipe.submitted_by}
                </div>
                <div className="col-3 recipe-details">
                    <div>{!this.props.recipe.isPublic || this.props.recipe.isPublic === "0" ? 'Private' : 'Public'}</div>    
                    <div><StarBar stars={this.props.recipe.rating} /></div>
                    <div className="edit-delete"> 
                    { this.props.isAdmin && 
                        <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editRecipe(this.props.recipe.id)} />
                    }
                    { this.props.isAdmin && 
                        <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteRecipe(this.props.recipe.id)} />
                    }
                    </div>
                </div>
            </div>


        )
    }
}
export default RecipeRow;