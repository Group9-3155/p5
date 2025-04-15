import React from 'react';
import {
    Button, TextField,
    ImageList, ImageListItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography
} from '@mui/material';
import './userFavorites.css';
import axios from 'axios';


/**
 * Define UserFavorites, a React component of project #5
 */
class UserFavorites extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user_id : undefined,
            favorites: undefined,
            new_comment: undefined,
            add_comment: false,
            current_photo_id: undefined
        };
        this.handleCancelAddComment = this.handleCancelAddComment.bind(this);
        this.handleSubmitAddComment = this.handleSubmitAddComment.bind(this);
    }
//Minor Changes
    componentDidMount() {
        const new_user_id = this.props.match.params.userId;
        this.handleUserChange(new_user_id);
    }
// could cause error
    componentDidUpdate(prevProps) {
        const new_user_id = this.props.match.params.userId;
        if (prevProps.match.params.userId !== new_user_id) {
            this.handleUserChange(new_user_id);
        }
    }
    

    handleUserChange(user_id) {
        axios.get("/favorites/" + user_id)
            .then((response) => {
                const favorites = response.data.favorites;
                this.setState({
                    user_id: user_id,
                    favorites: favorites
                });
                return axios.get("/user/" + user_id);
            })
            .then((response) => {
                const user = response.data;
                const main_content = "Favorites for " + user.first_name + " " + user.last_name;
                this.props.changeMainContent(main_content);
            })
            .catch((error) => {
                console.log('catch', error);
            });
    }
    
    

    handleNewCommentChange = (event) => {
        this.setState({
            new_comment: event.target.value
        });
    };

    handleShowAddComment = (event) => {
        const photo_id = event.target.attributes.photo_id.value;
        this.setState({
            add_comment: true,
            current_photo_id: photo_id
        });
    };

    handleCancelAddComment = () => {
        this.setState({
            add_comment: false,
            new_comment: undefined,
            current_photo_id: undefined
        });
    };

    handleSubmitAddComment = () => {
        const currentState = JSON.stringify({comment: this.state.new_comment});
        const photo_id = this.state.current_photo_id;
        const user_id = this.state.user_id;
        axios.post("/commentsOfPhoto/" + photo_id,
            currentState,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(() =>
            {
                this.setState({
                    add_comment : false,
                    new_comment: undefined,
                    current_photo_id: undefined
                });
                axios.get("/favorites/" + user_id)
                    .then((response) =>
                    {
                        this.setState({
                            favorites: response.data.favorites
                        });
                    });
            })
            .catch( error => {
                console.log(error);
            });
    };

    handleRemoveFromFavorites = (user_id, photo_id) => {
        console.log(`Deleting favorite for user ${user_id} and photo ${photo_id}`);
        axios.delete(`/favorites/${user_id}/${photo_id}`)
            .then(() => {
                axios.get("/favorites/" + user_id)
                    .then((response) => {
                        this.setState({
                            favorites: response.data.favorites
                        });
                    });
            })
            .catch(error => {
                console.error("Error removing from favorites:", error);
            });
    };

    render() {
        const hasFavorites = this.state.favorites && this.state.favorites.length > 0;
    
        return (
            <div>
                <div>
                    <Button variant="contained" component="a" href={"#/users/" + this.state.user_id}>
                        User Detail
                    </Button>
                </div>
    
                {hasFavorites ? (
                    <ImageList variant="masonry" cols={1} gap={8}>
                        {this.state.favorites.map((item) => (
                            <div key={item._id}>
                                <TextField label="Photo Date" variant="outlined" disabled fullWidth margin="normal"
                                           value={item.date_time} />
                                <Button
                                    variant="contained"
                                    onClick={() => this.handleRemoveFromFavorites(this.state.user_id, item._id)}
                                >
                                    Unfavorite
                                </Button>
                                <ImageListItem key={item.file_name}>
                                    <img
                                        src={`images/${item.file_name}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                        srcSet={`images/${item.file_name}?w=164&h=164&fit=crop&auto=format`}
                                        alt={item.file_name}
                                        loading="lazy"
                                    />
                                </ImageListItem>
                                <div>
                                    {item.comments ? item.comments.map((comment) => (
                                        <div key={comment._id}>
                                            <TextField label="Comment Date" variant="outlined" disabled fullWidth
                                                       margin="normal" value={comment.date_time} />
                                            <TextField label="User" variant="outlined" disabled fullWidth
                                                margin="normal"
                                                value={comment.user_id ? comment.user_id.first_name + " " + comment.user_id.last_name : "Unknown User"}
                                                component="a" href={comment.user_id ? "#/users/" + comment.user_id._id : "#"}>
                                            </TextField>
                                            <TextField label="Comment" variant="outlined" disabled fullWidth
                                                       margin="normal" multiline rows={4} value={comment.comment} />
                                        </div>
                                    )) : (
                                        <Typography>No Comments</Typography>
                                    )}
                                    <Button photo_id={item._id} variant="contained" onClick={this.handleShowAddComment}>
                                        Add Comment
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </ImageList>
                ) : (
                    <TextField variant="outlined" disabled fullWidth
                        margin="normal" value="No Favorites" />
                )}
    
                <Dialog open={this.state.add_comment}>
                    <DialogTitle>Add Comment</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Enter New Comment for Photo
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="comment"
                            label="Comment"
                            multiline rows={4}
                            fullWidth
                            variant="standard"
                            onChange={this.handleNewCommentChange}
                            defaultValue={this.state.new_comment}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCancelAddComment}>Cancel</Button>
                        <Button onClick={this.handleSubmitAddComment}>Add</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}
export default UserFavorites;
