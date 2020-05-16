import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

class RecipeRow extends React.Component {
    render(){
        return (
            <tr key={this.props.recipe.id}>
                <td colspan="6"><a href="#" onClick={() => this.props.viewRecipe(this.props.recipe.id)}>{this.props.recipe.name}</a></td>
                <td colspan="2">{this.props.recipe.submitted_by}</td>
                <td>{this.props.recipe.rating}</td>
                <td>{!this.props.recipe.isPublic || this.props.recipe.isPublic === "0" ? 'Yes' : 'No'}</td>
                <td>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group" style={{ marginBottom: "20px" }}>
                            { this.props.isAdmin && 
                            <span>
                                <FontAwesomeIcon alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}} size="2x" icon={faEdit} onClick={() => this.props.editRecipe(this.props.recipe.id)} />
                            </span>
                            }
                            { this.props.isAdmin && 
                            <span>
                                <FontAwesomeIcon  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}} size="2x" icon={faTrash} onClick={() => this.props.deleteRecipe(this.props.recipe.id)} />
                            </span>
                            }
                        </div>
                    </div>
                </td>
            </tr>
        )
    }
}
export default RecipeRow;