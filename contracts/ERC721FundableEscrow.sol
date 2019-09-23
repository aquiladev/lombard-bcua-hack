pragma solidity ^0.5.2;

import "./../client/node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "./ERC721Escrow.sol";

contract ERC721FundableEscrow is ERC721Escrow, IERC721Receiver {
    enum State { Init, Active, Funded, Refunded, Closed }
    struct Escrow {
        State state;
        address token;
        uint256 tokenId;
        address funder;
        uint256 amount;
        uint256 duration;
        uint256 expiration;
    }

    event Published(address indexed owner, address indexed token, uint256 tokenId, uint256 weiAmount);
    event Unpublished(address indexed owner, address indexed token, uint256 tokenId);
    event Funded(address indexed payee, address indexed token, uint256 tokenId, uint256 weiAmount);
    event Refunded(address indexed payee, address indexed token, uint256 tokenId, uint256 weiAmount);
    event Claimed(address indexed to, address indexed token, uint256 tokenId);

    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    /*
     * 0x80ac58cd ===
     *     bytes4(keccak256('balanceOf(address)')) ^
     *     bytes4(keccak256('ownerOf(uint256)')) ^
     *     bytes4(keccak256('approve(address,uint256)')) ^
     *     bytes4(keccak256('getApproved(uint256)')) ^
     *     bytes4(keccak256('setApprovalForAll(address,bool)')) ^
     *     bytes4(keccak256('isApprovedForAll(address,address)')) ^
     *     bytes4(keccak256('transferFrom(address,address,uint256)')) ^
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'))
     */

    mapping(bytes32 => Escrow) public _escrows;

    modifier onlyLender(bytes32 key) {
        require(msg.sender == _escrows[key].funder, "Only funder can execute");
        _;
    }

    function getKey(address token, uint256 tokenId) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(token, tokenId));
    }

    function publish(IERC721 token, uint256 tokenId, uint256 weiAmount, uint256 duration) public {
        require(token.supportsInterface(_INTERFACE_ID_ERC721), "IS_NOT_721_TOKEN");

        address tokenAddress = address(token);
        bytes32 key = getKey(tokenAddress, tokenId);
        require(_owners[key] == address(0), "Escrow exists");
        require(_escrows[key].state == State.Init ||
            _escrows[key].state == State.Closed, "Escrow is active");
        require(weiAmount != 0, "Amount should be greater than zero");

        _escrows[key].state = State.Active;
        _escrows[key].amount = weiAmount;
        _escrows[key].token = tokenAddress;
        _escrows[key].tokenId = tokenId;
        _escrows[key].duration = duration;
        _deposit(msg.sender, key);

        emit Published(msg.sender, tokenAddress, tokenId, weiAmount);

        // TODO: use safe transfer
        token.transferFrom(msg.sender, address(this), tokenId);
    }

    function unpublish(bytes32 key) public exists(key) onlyOwner(key) {
        require(_escrows[key].state == State.Init ||
            _escrows[key].state == State.Active ||
            _escrows[key].state == State.Refunded, "Should be active or refunded");

        uint256 tokenId = _escrows[key].tokenId;
        address tokenAddress = _escrows[key].token;

        _escrows[key].state = State.Init;
        _escrows[key].amount = 0;
        _escrows[key].funder = address(0);
        _escrows[key].token = address(0);
        _escrows[key].tokenId = 0;
        _escrows[key].duration = 0;
        _escrows[key].expiration = 0;
        _withdraw(msg.sender, key);

        emit Unpublished(msg.sender, tokenAddress, tokenId);

        IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    }

    // TODO: Amount should be checked, latests version is funding 50% of original NFT amount
    function fund(bytes32 key) public payable exists(key) notOwner(key) {
        require(_escrows[key].state == State.Active, "Should be active");
        uint256 amount = msg.value;
        // require(amount == _escrows[key].amount, "Value should be equal token value");

        _escrows[key].state = State.Funded;
        _escrows[key].funder = msg.sender;
        _escrows[key].amount = amount;
        _escrows[key].expiration = block.number + _escrows[key].duration;
        emit Funded(msg.sender, _escrows[key].token, _escrows[key].tokenId, amount);

        _forward(_owners[key]);
    }

    function refund(bytes32 key) public payable exists(key) onlyOwner(key) {
        require(_escrows[key].state == State.Funded, "Should be funded");
        uint256 amount = msg.value;
        require(amount == _escrows[key].amount, "Value should be equal token value");

        _escrows[key].state = State.Refunded;
        _escrows[key].expiration = 0;
        emit Refunded(msg.sender, _escrows[key].token, _escrows[key].tokenId, amount);

        _forward(_escrows[key].funder);
    }

    function claim(bytes32 key) public exists(key) onlyLender(key) {
        // require(_escrows[key].state == State.Funded, "Should be funded");
        require(isAllowClaim(key), "It is possible to claim funded escrows after expiration");

        uint256 tokenId = _escrows[key].tokenId;
        address tokenAddress = _escrows[key].token;

        _escrows[key].state = State.Init;
        _escrows[key].amount = 0;
        _escrows[key].funder = address(0);
        _escrows[key].token = address(0);
        _escrows[key].tokenId = 0;
        _escrows[key].duration = 0;
        _escrows[key].expiration = 0;
        _withdraw(msg.sender, key);

        emit Claimed(msg.sender, tokenAddress, tokenId);

        IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    }

    function isAllowClaim(bytes32 key) public view returns (bool) {
        return _escrows[key].state == State.Funded && block.number > _escrows[key].expiration;
    }

    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // TODO: change from push to pull approach
    function _forward(address to) internal {
        address(uint160(to)).transfer(msg.value);
    }
}