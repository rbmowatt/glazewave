import React from "react";
import BoardCard from "./BoardCard";
import { Link } from 'react-router-dom';

export const NewestBoards = (props) => {
  if (!props.boards.length) {
    return (
    <div className="alert alert-primary text-center index-empty-resultset">
        <h5>Newest Boards</h5>
        <div>You haven't added any Boards Yet.</div>
        <div>
            <Link className="btn btn-sm btn-primary" to={'/board'} >Get Started!</Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h5>Newest Boards</h5>
      {
        props.boards.reduce((mappedArray, board, index) => {
          if (index < props.limit) {
            mappedArray.push(<BoardCard board={board} key={board.id} />);
          }
          return mappedArray;
        }, [])}
    </div>
  );
};
