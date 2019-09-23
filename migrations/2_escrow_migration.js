var ERC721FundableEscrow = artifacts.require("./ERC721FundableEscrow.sol");

module.exports = (deployer) => {
  deployer.then(async () => {
    const escrow = await deployer.deploy(ERC721FundableEscrow);
    console.log('ERC721FundableEscrow contract deployed at', escrow.address);
  });
};
