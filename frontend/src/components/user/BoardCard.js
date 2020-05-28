import React from 'react';
import StarBar from './../layout/StarBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

const BoardCard = props =>{
    return (
        <div className={props.className}>
            <div className="col-md-12"><h5><a href={"/board/" + props.board.id }>{props.board.name}</a></h5></div>
            <div className="col-md-3">
                <img src="https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg" />
            </div>
            <div className="col-md-9">
            <div className="col-md-12">
                { props.editBoard && <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => props.editBoard(props.board.id)} /> }
                { props.deleteBoard && <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => props.deleteBoard(props.board.id)} /> }
            </div>
            <   div>{props.board.Board.model}</div>
                <div>{props.board.size}</div>
                <div><StarBar stars={props.board.rating} /></div>
            </div>
        </div>
    )
}
export default BoardCard;