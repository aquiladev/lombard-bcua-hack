import React, { Component } from "react";
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between'
  }
});

class Price extends Component {
  render() {
    const { classes, token, web3 } = this.props;

    return (
      <div className={classes.root}>
        <Typography variant="subtitle2"
          color="textSecondary"
          component="p"
          noWrap={true}
          style={{maxWidth: '50%'}}>
          Price: Ξ <b>{web3.utils.fromWei(token.onchain.amount.toString('hex'), 'ether')}</b>
        </Typography>
        {
          token.last_sale &&
          <Typography variant="subtitle2"
            color="textSecondary"
            component="p"
            noWrap={true}
            style={{maxWidth: '50%'}}>
            Prev: Ξ {web3.utils.fromWei(token.last_sale.total_price, 'ether')}
          </Typography>
        }
      </div>
    )
  }
}

Price.propTypes = {
  classes: PropTypes.object.isRequired,
  token: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
};

export default withStyles(styles)(Price);