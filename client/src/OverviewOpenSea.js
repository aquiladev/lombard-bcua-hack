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
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';

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
  closeButton: {
    position: 'absolute',
    right: theme.spacing.unit,
    top: theme.spacing.unit,
    color: theme.palette.grey[500],
  },
  snackbar: {
    marginTop: 20,
    backgroundColor: theme.palette.error.dark,
    display: 'flex',
    flexWrap: 'nowrap'
  },
  icon: {
    fontSize: 20,
  },
  close: {
    padding: theme.spacing.unit / 2,
  },
});

class Overview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      step: 0,
      selected: null,
      value: 0,
      duration: 0,
      txHash: ''
    };

    this.closeDialog = this.closeDialog.bind(this);
    this.changeValue = this.changeValue.bind(this);
  }

  closeDialog() {
    this.setState({
      open: false,
      step: 0,
      error: null,
      value: 0,
      duration: 0,
      selected: null
    });
  }

  changeValue(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const { classes, items, web3, onApproveClick, onPublishClick } = this.props;
    const steps = ['Approve', 'Publish', 'Done'];

    return (
      <>
        {
          items.map((x, i) => {
            const name = x.name || x.asset_contract.name;
            return (
              <Card className={classes.card} key={i}>
                <CardActionArea>
                  <CardMedia
                    className={classes.media}
                    image={x.image_preview_url}
                    title={name}
                  />
                  <CardContent>
                    <Typography gutterBottom
                      variant="h5"
                      component="h2"
                      noWrap={true}
                      style={{ height: 32 }}>
                      {name}
                    </Typography>
                    <Typography variant="body2"
                      color="textSecondary"
                      component="p"
                      style={{ fontSize: 12 }}
                      noWrap={true}>
                      {x.asset_contract.name}#{x.token_id}
                    </Typography>
                    <Typography variant="body2"
                      color="textSecondary"
                      component="p"
                      style={{ height: 24 }}
                      noWrap={true}>
                      {x.description}
                    </Typography>
                    {
                      x.last_sale &&
                      <Typography variant="subtitle2"
                        color="textSecondary"
                        component="p"
                        noWrap={true}
                        style={{ maxWidth: '50%' }}>
                        Prev: Ξ {web3.utils.fromWei(x.last_sale.total_price, 'ether')}
                      </Typography>
                    }
                  </CardContent>
                </CardActionArea>
                <CardActions style={{ justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={_ => { this.setState({ open: true, selected: x }) }}>
                    Lend
                  </Button>
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
            <Typography variant="title">Publishing process</Typography>
            <IconButton aria-label="Close" className={classes.closeButton} onClick={this.closeDialog}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {
              this.state.error &&
              <SnackbarContent
                className={classes.snackbar}
                message={this.state.error}
                action={[
                  <IconButton
                    key="close"
                    aria-label="Close"
                    color="inherit"
                    onClick={() => { this.setState({ error: null }) }}
                    className={classes.close}>
                    <CloseIcon className={classes.icon} />
                  </IconButton>
                ]} />
            }
            <Stepper activeStep={this.state.step}>
              {steps.map((label, index) => {
                return (
                  <Step key={index}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            {
              this.state.step === 0 &&
              <>
                <Typography variant="subtitle1" component="p">In order to lend your token asset you need to pass couple of steps.</Typography>
                <Typography variant="subtitle1" component="p" style={{ paddingTop: 16 }}>
                  First, approve the token for escrow contract. It makes the token accessible for contract in order to lock it.
                  </Typography>
              </>
            }
            {
              this.state.step === 1 &&
              <>
                <Typography variant="subtitle1" component="p">Second, publish token with a value.</Typography>
                {
                  this.state.selected.last_sale &&
                  <Typography variant="subtitle2"
                    color="textSecondary"
                    component="p"
                    noWrap={true}>
                    Prev price: Ξ {web3.utils.fromWei(this.state.selected.last_sale.total_price, 'ether')}
                  </Typography>
                }
                <Grid container>
                  <Grid item xs={6}>
                    <TextField
                      label="Value in Ether"
                      value={this.state.value}
                      onChange={(event) => { this.setState({ value: event.target.value }); }}
                      type="number"
                      className={classes.textField}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      margin="normal"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Duration in blocks"
                      value={this.state.duration}
                      onChange={(event) => { this.setState({ duration: event.target.value }); }}
                      type="number"
                      className={classes.textField}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      margin="normal"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </>
            }
            {
              this.state.step === 2 &&
              <Typography variant="subtitle1" component="p" noWrap={true}>
                Transaction sent <a href={`https://rinkeby.etherscan.io/tx/${this.state.txHash}`}>{this.state.txHash}</a>
              </Typography>
            }
          </DialogContent>
          <DialogActions>
            {
              this.state.step === 0 &&
              <Button
                onClick={() => {
                  onApproveClick(this.state.selected)
                    .then(_ => {
                      this.setState({ step: 1, error: null })
                    })
                    .catch(e => {
                      this.setState({ error: e.message })
                    })
                }}
                color="primary"
                variant="contained">
                Approve
                </Button>
            }
            {
              this.state.step === 1 &&
              <Button
                onClick={() => {
                  const value = +this.state.value;
                  if (value <= 0) {
                    this.setState({ error: "Value cannot be zero or negative" });
                    return;
                  }

                  const duration = +this.state.duration;
                  if (duration < 0) {
                    this.setState({ error: "Duration is required and must be equal or greater then zero" });
                    return;
                  }

                  onPublishClick(this.state.selected, '' + value, duration)
                    .then(txHash => {
                      this.setState({
                        step: 2,
                        error: null,
                        value: 0,
                        duration: 0,
                        selected: null,
                        txHash
                      })
                    })
                    .catch(e => {
                      this.setState({ error: e.message })
                    })
                }}
                color="primary"
                variant="contained">
                Publish
                </Button>
            }{
              this.state.step === 2 &&
              <Button
                onClick={() => { this.setState({ step: 0, txHash: '', open: false }) }}
                color="primary"
                variant="contained">
                Close
                </Button>
            }
          </DialogActions>
        </Dialog>
      </>
    )
  }
}

Overview.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  web3: PropTypes.object.isRequired,
  onApproveClick: PropTypes.func.isRequired,
  onPublishClick: PropTypes.func.isRequired,
};

export default withStyles(styles)(Overview);