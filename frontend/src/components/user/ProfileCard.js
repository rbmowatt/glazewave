import React from 'react';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import ImageUploader from 'react-images-upload';
import moment from 'moment';
import UserRequests from './../../requests/UserRequests';
import { s3Conf } from './../../config/s3';
import { loadUser, updateUserImage, loadUserAverages } from './../../actions/user';

const mapStateToProps = state => {
    return { user: state.user.data, session: state.session, aggregations: state.user.averages }
}
const mapDispachToProps = dispatch => {
    return {
        updateImage: (session, params) => dispatch(updateUserImage(session, params)),
        loadUser: (session, params) => dispatch(loadUser(session, params)),
        loadUserAverages: (session, params) => dispatch(loadUserAverages(session, params))
    }
}

class ProfileCard extends React.Component {

    constructor() {
        super();
        this.state = {
            board_id: null,
            manufacturer_id: null,
            uploaderInstance: 1
        };
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            this.props.loadUser(this.props.session, { id: this.props.session.user.id });
            this.props.loadUserAverages(this.props.session, { id: this.props.session.user.id });
        }
    }

    onDrop(pictureFiles, pictureDataURLs) {
        const formData = UserRequests.createFormRequest({ user_id: this.props.session.user.id });
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.updateImage(this.props.session, { data: formData });
        this.setState({ uploaderInstance: this.state.uploaderInstance + 1 })
    }

    render() {
        const { user, aggregations } = this.props;
        const image = user.profile_img
            ? s3Conf.root + user.profile_img
            : '/img/session_default_lg.png';

        // Every aggregation comes back through toFixed(1), so total_sessions
        // arrives as "148.0" and has to be rounded before it is shown.
        const totalSessions = aggregations.total_sessions
            ? Math.round(aggregations.total_sessions)
            : 0;
        const rating = Number(aggregations.session_rating) || 0;

        return (
            <React.Fragment>
                <div className="gw-profile-head">
                    <img className="gw-profile-img" src={image} alt="" />
                    <div>
                        <div className="gw-profile-name">{user.first_name} {user.last_name}</div>
                        {user.createdAt &&
                            <div className="gw-profile-since">
                                SINCE {moment(user.createdAt).format("MM / YYYY")}
                            </div>
                        }
                    </div>
                </div>

                <hr className="gw-rule" />

                <div className="d-flex flex-column" style={{ gap: '14px' }}>
                    <div className="gw-eyebrow">Lifetime</div>
                    <div className="gw-stat-row">
                        <div className="gw-stat-label">Sessions logged</div>
                        <div className="gw-stat-value">{totalSessions}</div>
                    </div>
                    <div className="gw-stat-row">
                        <div className="gw-stat-label">Boards in quiver</div>
                        <div className="gw-stat-value">{this.props.boardCount}</div>
                    </div>
                    <div className="gw-stat-row">
                        <div className="gw-stat-label">Spots surfed</div>
                        <div className="gw-stat-value">{this.props.spotCount}</div>
                    </div>
                </div>

                <hr className="gw-rule" />

                <div className="d-flex flex-column" style={{ gap: '10px' }}>
                    <div className="gw-stat-row">
                        <div className="gw-eyebrow">Avg rating</div>
                        <div className="gw-mono" style={{ fontSize: '13px', color: '#3fd0dd' }}>
                            {rating ? `${rating} / 10` : '--'}
                        </div>
                    </div>
                    <div className="gw-meter">
                        <div className="gw-meter-fill" style={{ width: `${rating * 10}%` }} />
                    </div>
                </div>

                <hr className="gw-rule" />

                <div className="d-flex flex-column" style={{ gap: '9px' }}>
                    <div className="gw-eyebrow">Actions</div>
                    <Link className="gw-btn gw-btn-primary" to={'/session/create'}>Log a session</Link>
                    <Link className="gw-btn" to={'/board/create'}>Add a board</Link>
                    <div className="gw-uploader">
                        <ImageUploader
                            key={this.state.uploaderInstance}
                            withIcon={false}
                            buttonText='Update profile photo'
                            onChange={this.onDrop}
                            imgExtension={['.jpg', '.gif', '.png', '.gif']}
                            maxFileSize={5242880}
                            label=''
                            withPreview={false}
                            singleImage={true}
                        />
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(ProfileCard);
