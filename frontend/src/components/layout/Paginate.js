import * as React from 'react';
import { connect } from 'react-redux'
import ReactPaginate from 'react-paginate';
import './css/Paginate.css';



const mapStateToProps = state => {
    return { session: state.session }
  }

class Paginate extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            offset: 0,
            elements: [],
            perPage: props.perPage || 4,
            currentPage: 0,
            pageCount : 0
          };
    }

    componentDidMount()
    {
        (this.props.data.length && !this.state.elements.length) && this.setElementsForCurrentPage(this.props.data);
    }
    
    componentDidUpdate(prevProps, prevState, snapshot)
    {
      //console.log('update', prevProps)
        //((this.props.data.length && !this.state.elements.length)  || (this.props.data.length !== prevProps.data.length))  && this.setElementsForCurrentPage(this.props.data);
        JSON.stringify(prevProps.data) !== JSON.stringify(this.props.data) && this.setElementsForCurrentPage(this.props.data);
    }

    setElementsForCurrentPage(boards) {
        let elements = boards
        .slice(this.state.offset, this.state.offset + this.state.perPage);
        const pageCount = Math.ceil(boards.length/this.state.perPage);
        this.setState({ pageCount : pageCount, elements : elements });
        this.props.updatePaginationElements(elements, this.state.currentPage)
      }

      handlePageClick = (data) => {
        const selectedPage = data.selected;
        const offset = selectedPage * this.state.perPage;
        this.setState({ currentPage: selectedPage, offset: offset }, () => {
          this.setElementsForCurrentPage(this.props.data);
        });
      }

    render() {
        return <ReactPaginate
        previousLabel={"← Previous"}
        nextLabel={"Next →"}
        breakLabel={<span className="gap">...</span>}
        pageCount={this.state.pageCount}
        onPageChange={this.handlePageClick}
        forcePage={this.props.currentPage}
        containerClassName={"pagination"}
        previousLinkClassName={"previous_page"}
        nextLinkClassName={"next_page"}
        disabledClassName={"disabled"}
        activeClassName={"active"}
        />
    }
}

export default connect(mapStateToProps)(Paginate);
