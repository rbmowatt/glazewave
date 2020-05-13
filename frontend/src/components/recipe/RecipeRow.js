import React from 'react';
import { Link } from 'react-router-dom';

class RecipeRow extends React.Component {
    render(){
        return (
            <tr key={this.props.recipe.id}>
                <td>{this.props.recipe.name}</td>
                <td>{this.props.recipe.submitted_by}</td>
                <td>{this.props.recipe.rating}</td>
                <td>{!this.props.recipe.isPublic || this.props.recipe.isPublic === "0" ? 'Yes' : 'No'}</td>
                <td>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group" style={{ marginBottom: "20px" }}>
                            <Link to={`recipe/${this.props.recipe.id}`} className="btn btn-sm btn-success btn-outline-secondary">View Recipe </Link> 
                            { this.props.isAdmin &&  <Link to={`recipe/edit/${this.props.recipe.id}`} className="btn btn-warning btn-sm btn-outline-secondary">Edit Recipe </Link> }
                            { this.props.isAdmin && <button type="button" className="btn btn-danger btn-sm btn-outline-secondary" onClick={() => this.props.deleteRecipe(this.props.recipe.id)}>Delete Recipe</button> }
                        </div>
                    </div>
                </td>
            </tr>
        )
    }
}
export default RecipeRow;