import React, { Component } from "react";
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import axios from 'axios';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import ERC721FundableEscrow from "./contracts/ERC721FundableEscrow.json";
import ERC721Mock from "./contracts/ERC721Mock.json";
import getWeb3 from "./utils/getWeb3";
import Layout from './Layout';
import Overview from './OverviewOpenSea';
import Marketplace from './Marketplace';
import Nebula from './components/Nebula';

const styles = theme => ({
  container: {
    paddingTop: 20
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

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      accounts: null,
      networkId: 0,
      tokens: [],
      escrows: [],
      assets: [],
      error: null,
      selectedTab: 0,
      isLoading: true,
      chat: null,
      isChatOpen: false
    };

    this.selectTab = this.selectTab.bind(this);
    // this.lendToken = this.lendToken.bind(this);
    this.approveToken = this.approveToken.bind(this);
    this.publishToken = this.publishToken.bind(this);
    this.cancelEscrow = this.cancelEscrow.bind(this);
    this.fundEscrow = this.fundEscrow.bind(this);
    this.refundEscrow = this.refundEscrow.bind(this);
    this.claimEscrow = this.claimEscrow.bind(this);
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const supportedNetwork = 4;
      if (networkId !== supportedNetwork) {
        this.setState({ error: `The dapp supports ${supportedNetwork} network only!` });
        return;
      }

      const deployedNetwork = ERC721FundableEscrow.networks[networkId.toString()];
      // const escrowAddress = '0xb90CBa91814677766B4dF234d7Ea6E7eEbcA8822';
      const escrowAddress = deployedNetwork.address;
      const escrowContract = new web3.eth.Contract(ERC721FundableEscrow.abi, escrowAddress);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        accounts,
        networkId: networkId,
        escrowContract,
        escrowAddress
      }, this.load);
    } catch (error) {
      // Catch any errors for any of the above operations.
      this.setState({ error: 'Failed to load web3, accounts, or contract. Check console for details.' });
      console.error(error);
    }
  };

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  load() {
    this.loadMarketplace()
      .then(() => { return this.sleep(1000); })
      .then(this.loadOwn);
  }

  loadMarketplace = async () => {
    const { escrowContract, escrowAddress } = this.state;

    const { data } = await axios.get(`https://rinkeby-api.opensea.io/api/v1/assets?owner=${escrowAddress}`);
    const { assets } = data;

    const escrowAssets = assets.filter(x => x.owner.address.toLowerCase() === escrowAddress.toLowerCase());

    this.setState({ escrows: escrowAssets });

    return Promise.all(escrowAssets.map(x => {
      return new Promise(async (resolve) => {
        const key = await escrowContract.methods.getKey(x.asset_contract.address, x.token_id).call();
        const escrow = await escrowContract.methods._escrows(key).call();

        let allowClaim = false;
        if (+escrow.state === 2) {
          allowClaim = await escrowContract.methods.isAllowClaim(key).call();
          console.log(allowClaim);
        }

        const owner = await escrowContract.methods._owners(key).call();
        resolve({
          id: x.token_id,
          asset_address: x.asset_contract.address,
          escrow: { ...escrow, owner, allowClaim }
        });
      });
    }))
      .then(data => {
        const map = {};
        this.state.escrows.forEach(x => {
          map[x.token_id + "_" + x.asset_contract.address] = x;
        })

        const escrows = data.map(e => {
          return { ...map[e.id + "_" + e.asset_address], onchain: e.escrow };
        });

        console.log("ESCROWS", escrows);
        this.setState({ escrows, isLoading: false });
      });
  };

  loadOwn = async () => {
    const { accounts } = this.state;

    const { data } = await axios.get(`https://rinkeby-api.opensea.io/api/v1/assets?owner=${accounts[0]}`);
    const { assets } = data;

    const ownAssets = assets.filter(x => x.owner.address.toLowerCase() === accounts[0].toLowerCase());

    console.log("ASSETS", ownAssets);
    this.setState({ assets: ownAssets });
  }

  selectTab(_, newValue) {
    this.setState({ selectedTab: newValue });
  }

  // lendToken = (token) => {
  //   const { escrowAddress, accounts, escrowContract, web3 } = this.state;
  //   const { token_id, asset_contract } = token;
  //   const tokenAddress = asset_contract.address;

  //   const tokenContract = new web3.eth.Contract(ERC721Mock.abi, tokenAddress);

  //   this.updateState('assets', token, true);

  //   tokenContract.methods
  //     .approve(escrowAddress, token_id)
  //     .send({ from: accounts[0] })
  //     .on('transactionHash', _ => {
  //       escrowContract.methods
  //         .publish(tokenAddress, token_id, 500000)
  //         .send({ from: accounts[0] })
  //         .on('transactionHash', __ => {
  //           this.setState({ assets: this.state.assets.filter(t => !(t.token_id === token_id && t.asset_contract.address === tokenAddress)) });
  //         })
  //         .on('error', (e) => {
  //           this.updateState('assets', token, false, e.message);
  //           console.error(e);
  //         });
  //     })
  //     .on('error', (e) => {
  //       this.updateState('assets', token, false, e.message);
  //       console.error(e);
  //     });
  // }

  approveToken(token) {
    const { escrowAddress, accounts, web3 } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;
    const tokenContract = new web3.eth.Contract(ERC721Mock.abi, tokenAddress);

    this.updateState('assets', token, true);

    return new Promise((resolve, reject) => {
      tokenContract.methods
        .approve(escrowAddress, token_id)
        .send({ from: accounts[0] })
        .on('transactionHash', txHash => {
          resolve(txHash);
        })
        .on('error', (e) => {
          console.error(e);
          reject(e);
        });
    });
  }

  publishToken(token, value, duration = 0) {
    const { accounts, escrowContract, web3, assets } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.updateState('assets', token, true);

    return new Promise((resolve, reject) => {
      escrowContract.methods
        .publish(tokenAddress, token_id, web3.utils.toWei(value, 'ether'), duration)
        .send({ from: accounts[0] })
        .on('transactionHash', txHash => {
          this.setState({ assets: assets.filter(t => !(t.token_id === token_id && t.asset_contract.address === tokenAddress)) });
          resolve(txHash);
        })
        .on('error', (e) => {
          console.error(e);
          reject(e);
        });
    });
  }

  cancelEscrow = async (token) => {
    const { accounts, escrowContract, escrows } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.updateState('escrows', token, true);

    const key = await escrowContract.methods.getKey(tokenAddress, token_id).call();
    escrowContract.methods
      .unpublish(key)
      .send({ from: accounts[0] })
      .on('transactionHash', _ => {
        this.setState({ escrows: escrows.filter(t => !(t.token_id === token_id && t.asset_contract.address === tokenAddress)) });
      })
      .on('error', (e) => {
        this.updateState('escrows', token, false, e.message);
        console.error(e);
      });
  }

  fundEscrow = async (token) => {
    const { accounts, escrowContract, web3 } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.updateState('escrows', token, true);

    const key = await escrowContract.methods.getKey(tokenAddress, token_id).call();
    const amount = (new web3.utils.BN(token.onchain.amount)).div(new web3.utils.BN(2));
    escrowContract.methods
      .fund(key)
      .send({ from: accounts[0], value: amount })
      .on('transactionHash', _ => {
        this.updateState('escrows', token, false);
      })
      .on('error', (e) => {
        this.updateState('escrows', token, false, e.message);
        console.error(e);
      });
  }

  refundEscrow = async (token) => {
    const { accounts, escrowContract } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.updateState('escrows', token, true);

    const key = await escrowContract.methods.getKey(tokenAddress, token_id).call();
    escrowContract.methods
      .refund(key)
      .send({ from: accounts[0], value: token.onchain.amount })
      .on('transactionHash', _ => {
        this.updateState('escrows', token, false);
      })
      .on('error', (e) => {
        this.updateState('escrows', token, false, e.message);
        console.error(e);
      });
  }

  claimEscrow = async (token) => {
    const { accounts, escrowContract, escrows } = this.state;
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.updateState('escrows', token, true);

    const key = await escrowContract.methods.getKey(tokenAddress, token_id).call();
    escrowContract.methods
      .claim(key)
      .send({ from: accounts[0] })
      .on('transactionHash', _ => {
        this.setState({ escrows: escrows.filter(t => t.token_id === !(token_id && t.asset_contract.address === tokenAddress)) });
      })
      .on('error', (e) => {
        this.updateState('escrows', token, false, e.message);
        console.error(e);
      });
  }

  updateState(field, token, isLoading, error) {
    const { token_id, asset_contract } = token;
    const tokenAddress = asset_contract.address;

    this.setState({
      [field]: this.state[field].map(t => {
        return t.token_id === token_id && t.asset_contract.address === tokenAddress ? { ...t, isLoading } : t;
      }),
      error
    });
  }

  render() {
    const { classes } = this.props;

    return (
      <Layout>
        <Grid
          container
          direction="row"
          justify="center"
          alignItems="center"
          className={classes.container}>
          {
            this.state.error ?
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
                  </IconButton>,
                ]} /> :
              null
          }
          {
            this.state.isLoading ?
              <div style={{ height: 400 }}>
                <CircularProgress className={classes.progress} />
              </div> :
              <>
                <Grid item xs={12}>
                  <Tabs
                    value={this.state.selectedTab}
                    onChange={this.selectTab}
                    indicatorColor="primary"
                    textColor="primary"
                    centered
                  >
                    <Tab label="Marketplace" />
                    <Tab label="My tokens" />
                  </Tabs>
                </Grid>
                <Grid item xs={12}
                  container
                  direction="row"
                  justify="center"
                  alignItems="center"
                  className={classes.container}>
                  {this.state.selectedTab === 0 && <Marketplace
                    items={this.state.escrows}
                    address={this.state.accounts[0]}
                    web3={this.state.web3}
                    onCancelClick={this.cancelEscrow}
                    onFundClick={this.fundEscrow}
                    onRefundClick={this.refundEscrow}
                    onClaimClick={this.claimEscrow}
                    onOpenChatClick={(pubKey) => { this.setState({ chat: pubKey, isChatOpen: true }) }} />}
                  {this.state.selectedTab === 1 && <Overview
                    items={this.state.assets}
                    web3={this.state.web3}
                    onApproveClick={this.approveToken}
                    onPublishClick={this.publishToken} />}
                </Grid>
                <Nebula chat={this.state.chat}
                  isOpen={this.state.isChatOpen}
                  onOpenClick={(isOpen) => { this.setState({ isChatOpen: isOpen }) }} />
              </>
          }
        </Grid>
      </Layout>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);
