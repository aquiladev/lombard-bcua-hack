import React, { Component } from "react";
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  card: {
    maxWidth: 345,
  },
  media: {
    height: 240,
  },
});

class Overview extends Component {
  render() {
    const { classes, items, onLandClick } = this.props;
    return (
      <>
        {
          items.map((x, i) => {
            return (
              <Card className={classes.card} key={i}>
                <CardActionArea>
                  <CardMedia
                    className={classes.media}
                    image={x.image_url}
                    title={x.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {x.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" component="p">
                      {x.bio}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={_ => { onLandClick(x) }}>
                    Land
                  </Button>
                </CardActions>
              </Card>
            )
          })
        }
      </>
    )
  }
}

Overview.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  onLandClick: PropTypes.func.isRequired
};

export default withStyles(styles)(Overview);