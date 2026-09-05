import React from "react";
import { connect } from "react-redux";
import { Form } from "react-advanced-form";
import { Input, Button } from "react-advanced-form-addons";
import Location from "./../../form/Location";
import Conditions from "./../Conditions";
import rules from "./validation-rules";
import messages from "./validation-messages";
import moment from "moment";
import { loadUserBoards, clearUserBoards } from "./../../../actions/user_board";
import { refresh } from "./../../../lib/utils/cognito";

// What <input type="datetime-local"> reads and writes. It is local wall clock
// with no zone, which is why nothing sends this value anywhere as-is.
const LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";

const mapStateToProps = (state) => {
  return {
    session: state.session,
    boards: state.user_boards,
    user_sessions: state.user_sessions,
  };
};

const mapDispachToProps = (dispatch) => {
  return {
    loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
    clearBoards: () => dispatch(clearUserBoards()),
  };
};

class SessionForm extends React.Component {
  constructor(props) {
    refresh(props.session.user.id);
    super(props);
    this.defaultName = moment().format("MMMM D YYYY, h:mm a");
    this.state = {
      show: false,
      pictures: props.pictures,
      location_id: "",
      conditions: {},
      conditionsError: null,
      session_local: moment().format(LOCAL_FORMAT),
    };
  }

  onChange = (propertyName, newValue) => {
    const data = [];
    data[propertyName] = newValue;
    this.setState({
      ...data,
    });
  };

  // The backend floors this to a UTC hour to pick the reading, so the offset
  // has to be resolved here where the browser knows it. Sending local wall
  // clock puts a dawn session on the previous evening's conditions.
  sessionUtc = () => moment(this.state.session_local, LOCAL_FORMAT).toISOString();

  onSessionDateChange = (e) => {
    this.setState({ session_local: e.target.value });
  };

  componentDidMount() {
    if (this.props.session.isLoggedIn) {
      if (!this.props.boards.loaded)
        this.props.loadBoards(this.props.session, {
          wheres: { user_id: this.props.session.user.id },
        });
    }
  }

  componentWillUnmount() {
    this.props.clearBoards();
  }

  render() {
    return (
      <div className="container">
        <Form
          action={({ serialized, fields, form }) =>
            this.props.processFormSubmission({
              session: this.props.session,
              session_date: this.sessionUtc(),
              serialized,
              fields,
              form,
            })
          }
          rules={rules}
          messages={messages}
        >
          <div className="row">
            <div className="col-12 ">
              <Input
                name="title"
                label="Session Name"
                className="form-control"
                initialValue={this.defaultName}
                required
              />
              <label htmlFor="session_local">When Did You Paddle Out?</label>
              <input
                id="session_local"
                type="datetime-local"
                className="form-control"
                value={this.state.session_local}
                onChange={this.onSessionDateChange}
              />
              <Location
                id="location_id"
                name="location_id"
                label="Where You paddling Out?"
                className="form-control"
                onChange={this.onChange}
                at={this.sessionUtc()}
                value={this.state.location_id}
              />
            </div>
            <div className="col-12">
              {this.state.conditionsError && (
                <small className="form-text text-muted">
                  {this.state.conditionsError}
                </small>
              )}
              <Conditions values={this.state.conditions} />
            </div>
            <div className="col-12 clear-fix">
              <Input
                type="hidden"
                name="user_id"
                value={this.props.session.user.id}
              />
              <span style={{float : 'right'}}>
              <Button type="submit">
                {this.props.edit ? "Edit Session" : "Add Session"}
              </Button>
              </span>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispachToProps)(SessionForm);
