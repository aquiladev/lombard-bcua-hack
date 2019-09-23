const { BN, expectEvent, expectRevert, balance } = require('./../client/node_modules/openzeppelin-test-helpers');

const Mock = artifacts.require('./Mock.sol');
const ERC165Mock = artifacts.require('./ERC165Mock.sol');
const ERC721Mock = artifacts.require('./ERC721Mock.sol');
const ERC721FundableEscrow = artifacts.require('./ERC721FundableEscrow.sol');

contract('ERC721FundableEscrow', accounts => {
  let tokenId = new BN('0');
  let token;
  let escrow;

  beforeEach(async () => {
    tokenId = new BN('933');
    token = await ERC721Mock.new({ from: accounts[0] });
    escrow = await ERC721FundableEscrow.new(token.address, { from: accounts[0] });
  });

  describe('Publish', () => {
    it('reverts when publish unknown contract', async () => {
      const mock = await Mock.new({ from: accounts[0] });
      await expectRevert.unspecified(escrow.publish(mock.address, 1, 1, 0, { from: accounts[0] }));
    });

    it('reverts when publish non ERC721 token contract', async () => {
      const mock = await ERC165Mock.new({ from: accounts[0] });
      await expectRevert(escrow.publish(mock.address, 1, 1, 0, { from: accounts[0] }), 'IS_NOT_721_TOKEN');
    });

    it('reverts when amount is zero', async () => {
      tokenId = new BN('18');
      await expectRevert(escrow.publish(token.address, tokenId, 0, 0, { from: accounts[0] }), 'Amount should be greater than zero');
    });

    it('reverts when escrow exists', async () => {
      tokenId = new BN('3412');
      await mintAndApprove(tokenId, accounts[0]);
      await escrow.publish(token.address, tokenId, 3, 0, { from: accounts[0] });

      await expectRevert(escrow.publish(token.address, tokenId, 235, 0, { from: accounts[0] }), 'Escrow exists');
    });

    it('should activate escrow and transfer token', async () => {
      tokenId = new BN('9877');
      await mintAndApprove(tokenId, accounts[0]);

      const { logs } = await escrow.publish(token.address, tokenId, 120, 0, { from: accounts[0] });
      expectEvent.inLogs(logs, 'Published', {
        owner: accounts[0],
        token: token.address,
        tokenId: new BN('9877'),
        weiAmount: new BN('120')
      });
      (await token.ownerOf(tokenId)).should.equal(escrow.address);
    });
  });

  describe('Unpublish', () => {
    it('unpublish escrow', async () => {
      tokenId = new BN('544545');
      await mintAndApprove(tokenId, accounts[0]);
      await escrow.publish(token.address, tokenId, 231, 0, { from: accounts[0] });
      (await token.ownerOf(tokenId)).should.equal(escrow.address);
      const key = await escrow.getKey(token.address, tokenId);

      const { logs } = await escrow.unpublish(key, { from: accounts[0] });
      console.log(logs);

      (await token.ownerOf(tokenId)).should.equal(accounts[0]);
    });
  });

  describe('Fund', function () {
    it('reverts when escrow not exist', async () => {
      tokenId = new BN('812');
      const key = await escrow.getKey(token.address, tokenId);
      await expectRevert(escrow.fund(key, { from: accounts[0], value: 1 }), "Escrow doesn't exist");
    });

    it('reverts when owner funds', async () => {
      tokenId = new BN('221');
      await mintAndApprove(tokenId, accounts[0]);
      await escrow.publish(token.address, tokenId, 200, 0, { from: accounts[0] });
      const key = await escrow.getKey(token.address, tokenId);

      await expectRevert(escrow.fund(key, { from: accounts[0], value: 1 }), 'Owner cannot execute');
    });

    it('reverts when amount is not match', async () => {
      tokenId = new BN('5021');
      await mintAndApprove(tokenId, accounts[0]);
      await escrow.publish(token.address, tokenId, 200, 0, { from: accounts[0] });
      const key = await escrow.getKey(token.address, tokenId);

      await expectRevert(escrow.fund(key, { from: accounts[1], value: 1 }), 'Value should be equal token value');
    });

    it('should fund', async () => {
      tokenId = new BN('9648');
      await mintAndApprove(tokenId, accounts[0]);
      await escrow.publish(token.address, tokenId, 1000, 0, { from: accounts[0] });
      const key = await escrow.getKey(token.address, tokenId);
      const balanceTracker = await balance.tracker(accounts[0]);

      const { logs } = await escrow.fund(key, { from: accounts[1], value: 1000 });
      expectEvent.inLogs(logs, 'Funded', {
        payee: accounts[1],
        token: token.address,
        tokenId: new BN('9648'),
        weiAmount: new BN('1000')
      });

      (await balanceTracker.delta()).should.be.bignumber.equal('1000');
    });
  });

  mintAndApprove = async (id, account) => {
    await token.mint(account, id, { from: account });
    (await token.ownerOf(id)).should.equal(account);

    await token.approve(escrow.address, id, { from: account });
    (await token.getApproved(id)).should.equal(escrow.address);
  }
});
