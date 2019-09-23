import React, { Component } from "react";
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    minHeight: '100vh',
    position: 'relative'
  },
  logo: {
    height: 40,
    marginRight: 6
  },
  grow: {
    flexGrow: 1,
  },
  layout: {
    height: '100%',
    width: 'auto',
    paddingTop: 64,
    paddingBottom: 118,
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      width: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  footer: {
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    position: 'absolute',
    bottom: 0,
    width: '100%'
  }
});

class Layout extends Component {
  render() {
    const { classes, children } = this.props;

    return (
      <div className={classes.root}>
        <AppBar color="secondary">
          <Toolbar>
            <Typography variant="h2" color="inherit" noWrap className={classes.grow}>
              ЛомбарD
            </Typography>
          </Toolbar>
        </AppBar>
        <main className={classes.layout}>
          {children}
        </main>
      </div>
    )
  }
}

Layout.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node
};

export default withStyles(styles)(Layout);