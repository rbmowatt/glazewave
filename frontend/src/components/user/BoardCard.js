import React from 'react';
import StarBar from './../layout/StarBar';

const BoardCard = props =>{
    return (
        <div className="row col-md-12">
            <div className="col-md-12"><h5><a href={"/board/" + props.board.id }>{props.board.name}</a></h5></div>
            <div className="col-md-3">
                <img src="https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg" />
            </div>
            <div className="col-md-9">
                <div>{props.board.size}</div>
                <div><StarBar stars={props.board.rating} /></div>
                <div>{props.board.notes && props.board.notes.substring(0, 50)}...</div>
                <div>{new Date(props.board.createdAt).getMonth()}/{new Date(props.board.createdAt).getDate()}/{new Date(props.board.createdAt).getFullYear()}</div>
            </div>
        </div>
    )
}
export default BoardCard;