import React from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-advanced-form';
import { Input, Select, Textarea, Button } from 'react-advanced-form-addons';
import TypeAheadInput  from './../../form/TypeAheadInput';
import rules from './validation-rules'
import messages from './validation-messages'
import ImageUploader from 'react-images-upload';
import { sizes } from './../data/board_sizes';
import {loadShapers} from './../../../actions/shaper';
import {loadBoards} from './../../../actions/board';



const mapStateToProps = state => {
    return { session: state.session, boards: state.boards.data, shapers : state.shapers.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadShapers: (session, params) => dispatch( loadShapers(session, params)), 
        loadBoards: (session, params) => dispatch(loadBoards(session, params)), 
    };
  };

  const relations = {
      shapers : ['Board'],
      boards : ['Manufacturer']
  }

class UserBoardForm extends React.Component{

    constructor()
    {
        super();
        this.state = {
            board_id: null,
            manufacturer_id : null
        };
    }

    onChange = (propertyName , newValue ) => {
        const data = [];
        data[propertyName] = newValue;
        this.setState({
            ...data
        });
      };


    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            if(!this.props.boards.length) this.props.loadBoards(this.props.session, {limit : 1000,   withs : relations.boards});
            if(!this.props.shapers.length) this.props.loadShapers(this.props.session, {limit : 1000,   withs : relations.shapers});
        } else {
                this.props.history.push('/');
        }
    }

    getBoardSuggestions = value => {
        if(!value){
            return this.props.boards.filter(entity=>
                entity.manufacturer_id === this.state.manufacturer_id
            );
        }
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? [] : this.props.boards.filter(entity=>
            entity.model.toLowerCase().slice(0, inputLength) === inputValue && entity.manufacturer_id === this.state.manufacturer_id
        );
      };

      getShaperSuggestions = value => {
        if(!value) return this.props.shapers;
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? [] : this.props.shapers.filter(entity=>
            entity.name.toLowerCase().slice(0, inputLength) === inputValue
        );
      };


    render(){
        return (
            <div className="col-md-12">
                <Form action={({ serialized, fields, form}) => this.props.processFormSubmission({session : this.props.session, serialized, fields, form})} rules={rules} messages={messages} className="col-md-12 row">
                <div className="col-md-12 ">
                    <Input name="name" label="Nickname" className="form-control" required />
                    <TypeAheadInput  entity={this.props.shapers} name="manufacturer_id" 
                        keyName="name"
                        label="choose a shaper" 
                        className="form-control" 
                        placeholder="Unknown" 
                        value={this.state.manufacturer_id} 
                        setValue={this.onChange} 
                        getSuggestions={this.getShaperSuggestions} 
                        display={true} 
                        required 
                    />
                    <TypeAheadInput  entity={this.props.boards} 
                        name="board_id" 
                        keyName="model"
                        label="choose a model" 
                        className="form-control" 
                        placeholder="choose a board" 
                        value={this.state.board_id} 
                        setValue={this.onChange} 
                        getSuggestions={this.getBoardSuggestions}
                        display={this.state.manufacturer_id !== null }
                        required 
                    />
                    {
                        this.props.children 
                    }
                      <ImageUploader
                        withIcon={false}
                        buttonText='Choose images'
                        onChange={this.props.onDrop}
                        imgExtension={['.jpg', '.gif', '.png', '.gif']}
                        maxFileSize={5242880}
                        withPreview={true}
                    />
                </div>
      
                <div className="col-md-12">
                    <Input type="hidden" name="user_id" value={this.props.session.user.id} />
                    <Button type='submit'>  {(this.props.edit) ? ("Edit Board") : ( "Add Board") }</Button>
                </div>
                </Form>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps  )(UserBoardForm);