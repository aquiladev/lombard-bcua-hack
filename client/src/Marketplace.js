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
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import { Chat, Close } from '@material-ui/icons';
import moment from 'moment';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';

import Price from './components/Price';

const styles = theme => ({
  card: {
    position: 'relative',
    width: 270,
    marginRight: 30,
    marginBottom: 30,
  },
  media: {
    height: 240,
    backgroundPosition: 'top'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    color: 'black',
    backgroundColor: 'rgba(255,255,255,0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formControl: {
    margin: theme.spacing,
    minWidth: 120,
  },
  filters: {
    marginBottom: 30
  },
  filter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  meBadge: {
    width: '100%'
  },
  address: {
    display: 'flex',
    flexWrap: 'nowrap'
  },
  chatButton: {
    padding: 0
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.unit,
    top: theme.spacing.unit,
    color: theme.palette.grey[500],
  }
});

const stateList = ['Init', 'Active', 'Funded', 'Refunded'];

class Marketplace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      state: 0,
      onlyMine: false,
      open: false,
      selected: null
    };

    this.changeState = this.changeState.bind(this);
    this.changeFilter = this.changeFilter.bind(this);
  }

  changeState(event) {
    this.setState({ state: event.target.value });
  }

  changeFilter(event) {
    this.setState({ onlyMine: event.target.checked });
  };

  render() {
    const {
      classes,
      items,
      address,
      web3,
      onCancelClick,
      onFundClick,
      onRefundClick,
      onClaimClick,
      onOpenChatClick
    } = this.props;
    const { onlyMine, state } = this.state;

    let filteredItems = items;

    if (onlyMine) {
      filteredItems = filteredItems.filter(x => x.onchain.owner === address);
    }

    if (state !== 0) {
      filteredItems = filteredItems.filter(x => +x.onchain.state === state);
    }

    return (
      <>
        <Grid container alignItems="center" className={classes.filters}>
          <Grid item xs={6} className={classes.filter}>
            <FormControlLabel
              control={
                <Switch
                  checked={this.state.onlyMine}
                  onChange={this.changeFilter}
                  value="checkedB"
                  color="primary"
                  inputProps={{ 'aria-label': 'primary checkbox' }}
                />
              }
              label="Only mine"
            />
          </Grid>
          <Grid item xs={6} className={classes.filter}>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel htmlFor="outlined-age-simple">
                State
              </InputLabel>
              <Select
                value={state}
                onChange={this.changeState}
                input={<OutlinedInput labelWidth={40} name="state" />}
              >
                <MenuItem value={0}>All</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={2}>Funded</MenuItem>
                <MenuItem value={3}>Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {
          filteredItems.map((x, i) => {
            return (
              <Card className={classes.card} key={i}>
                <CardActionArea>
                  <CardMedia
                    className={classes.media}
                    image={x.image_original_url || '#'}
                    title={x.name}
                  />
                  <CardContent>
                    <Typography gutterBottom
                      variant="h5"
                      component="h2"
                      noWrap={true}
                      style={{ height: 32 }}>
                      {x.name}
                    </Typography>
                    <Typography variant="body2"
                      color="textSecondary"
                      component="p"
                      noWrap={true}
                      style={{ height: 24 }}>
                      {x.description}
                    </Typography>
                    {
                      x.onchain.owner === address ?
                        <Badge className={classes.meBadge} badgeContent="Me" color="primary">
                          <Typography variant="subtitle2"
                            color="textSecondary"
                            component="p"
                            noWrap={true}
                            style={{ height: 24 }}>
                            Owner: {x.onchain.owner}
                          </Typography>
                        </Badge> :
                        <div className={classes.address}>
                          <Typography variant="subtitle2"
                            color="textSecondary"
                            component="p"
                            noWrap={true}
                            style={{ height: 24 }}>
                            Owner: {x.onchain.owner}
                          </Typography>
                          <IconButton className={classes.chatButton}
                            onClick={() => { onOpenChatClick('0x044fb2d66f923158121efcbc9cd2661dc83fd655716cafbada114d992cd5cbc5714d21d9f7231d31a79a3c3428fd16f877edb3004534c4982fc632c3b9f7587014') }}>
                            <Chat />
                          </IconButton>
                        </div>
                    }
                    <Typography variant="subtitle2"
                      color="textSecondary"
                      component="p"
                      noWrap={true}
                      style={{ height: 24 }}>
                      State: <b>{stateList[x.onchain.state]}</b>
                    </Typography>
                    <Price token={x} web3={web3} />
                    <Typography variant="subtitle2"
                      color="textSecondary"
                      component="p"
                      noWrap={true}
                      style={{ height: 24 }}>
                      Duration: <b>~{moment.duration(x.onchain.duration * 15, "seconds").humanize()}</b>
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions style={{ justifyContent: 'center', height: 52 }}>
                  {
                    x.onchain.owner === address && +x.onchain.state === 1 ?
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={_ => { onCancelClick(x) }}>
                        Cancel
                      </Button> :
                      null
                  }
                  {
                    x.onchain.owner === address && +x.onchain.state === 2 ?
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={_ => { onRefundClick(x) }}>
                        Refund
                      </Button> :
                      null
                  }
                  {
                    x.onchain.owner === address && +x.onchain.state === 3 ?
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={_ => { onCancelClick(x) }}>
                        Withdraw
                      </Button> :
                      null
                  }
                  {
                    x.onchain.owner !== address && +x.onchain.state === 1 ?
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={_ => { this.setState({ open: true, selected: x }) }}>
                        Fund
                      </Button> :
                      null
                  }
                  {
                    x.onchain.funder === address &&
                      +x.onchain.state === 2 &&
                      x.onchain.allowClaim ?
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={_ => { onClaimClick(x) }}>
                        Claim
                      </Button> :
                      null
                  }
                </CardActions>
                {
                  x.isLoading ?
                    <div className={classes.overlay}>
                      <CircularProgress />
                    </div> :
                    null
                }
              </Card>
            )
          })
        }
        <Dialog
          disableBackdropClick
          disableEscapeKeyDown
          maxWidth="sm"
          fullWidth
          aria-labelledby="confirmation-dialog-title"
          open={this.state.open}
        >
          <DialogTitle id="confirmation-dialog-title" disableTypography>
            <Typography variant="title">Funding process</Typography>
            <IconButton
              aria-label="Close"
              className={classes.closeButton}
              onClick={() => this.setState({ open: false, selected: null })}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" component="p">You may finance 50% of NFT's value</Typography>
            {
              this.state.selected &&
              <>
                <Typography variant="subtitle1" component="p">
                  Amount: Ξ <b>{web3.utils.fromWei((new web3.utils.BN(this.state.selected.onchain.amount)).div(new web3.utils.BN(2)), 'ether')}</b>
                </Typography>
                <Typography variant="subtitle1" component="p">
                  Interest: <b>2%</b>
                </Typography>
                <Typography variant="subtitle1" component="p">
                  Duration: <b>~{moment.duration(this.state.selected.onchain.duration * 15, "seconds").humanize()}</b>
                </Typography>
              </>
            }
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => { onFundClick(this.state.selected) }}
              color="primary"
              variant="contained">
              Fund
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }
}

Marketplace.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  address: PropTypes.string.isRequired,
  web3: PropTypes.object.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFundClick: PropTypes.func.isRequired,
  onRefundClick: PropTypes.func.isRequired,
  onClaimClick: PropTypes.func.isRequired,
  onOpenChatClick: PropTypes.func.isRequired
};

export default withStyles(styles)(Marketplace);