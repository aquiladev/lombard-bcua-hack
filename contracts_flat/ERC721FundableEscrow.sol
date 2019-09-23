
// File: client\node_modules\openzeppelin-solidity\contracts\token\ERC721\IERC721Receiver.sol

pragma solidity ^0.5.2;

/**
 * @title ERC721 token receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from ERC721 asset contracts.
 */
contract IERC721Receiver {
    /**
     * @notice Handle the receipt of an NFT
     * @dev The ERC721 smart contract calls this function on the recipient
     * after a `safeTransfer`. This function MUST return the function selector,
     * otherwise the caller will revert the transaction. The selector to be
     * returned can be obtained as `this.onERC721Received.selector`. This
     * function MAY throw to revert and reject the transfer.
     * Note: the ERC721 contract address is always the message sender.
     * @param operator The address which called `safeTransferFrom` function
     * @param from The address which previously owned the token
     * @param tokenId The NFT identifier which is being transferred
     * @param data Additional data with no specified format
     * @return bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
     */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data)
    public returns (bytes4);
}

// File: client\node_modules\openzeppelin-solidity\contracts\introspection\IERC165.sol

pragma solidity ^0.5.2;

/**
 * @title IERC165
 * @dev https://eips.ethereum.org/EIPS/eip-165
 */
interface IERC165 {
    /**
     * @notice Query if a contract implements an interface
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @dev Interface identification is specified in ERC-165. This function
     * uses less than 30,000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// File: client\node_modules\openzeppelin-solidity\contracts\token\ERC721\IERC721.sol

pragma solidity ^0.5.2;


/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://eips.ethereum.org/EIPS/eip-721
 */
contract IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) public view returns (uint256 balance);
    function ownerOf(uint256 tokenId) public view returns (address owner);

    function approve(address to, uint256 tokenId) public;
    function getApproved(uint256 tokenId) public view returns (address operator);

    function setApprovalForAll(address operator, bool _approved) public;
    function isApprovedForAll(address owner, address operator) public view returns (bool);

    function transferFrom(address from, address to, uint256 tokenId) public;
    function safeTransferFrom(address from, address to, uint256 tokenId) public;

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public;
}

// File: contracts\IERC721Escrow.sol

pragma solidity ^0.5.2;

contract IERC721Escrow {
}

// File: contracts\ERC721Escrow.sol

pragma solidity ^0.5.2;

contract ERC721Escrow is IERC721Escrow {
    event Deposited(address indexed from, bytes32 key);
    event Withdrawn(address indexed to, bytes32 key);

    mapping(bytes32 => address) public _owners;

    modifier exists(bytes32 key) {
        require(_owners[key] != address(0), "Escrow doesn't exist");
        _;
    }

    modifier onlyOwner(bytes32 key) {
        require(msg.sender == _owners[key], "Only owner can execute");
        _;
    }

    modifier notOwner(bytes32 key) {
        require(msg.sender != _owners[key], "Owner cannot execute");
        _;
    }

    function _deposit(address from, bytes32 key) internal {
        _owners[key] = from;
        emit Deposited(from, key);
    }

    function _withdraw(address to, bytes32 key) internal {
        _owners[key] = address(0);
        emit Withdrawn(to, key);
    }

    function () external payable {
        revert("Not supported");
    }
}

// File: contracts\ERC721FundableEscrow.sol

pragma solidity ^0.5.2;

contract ERC721FundableEscrow is ERC721Escrow, IERC721Receiver {
    enum State { Init, Active, Funded, Refunded, Closed }
    struct Escrow {
        State state;
        address token;
        uint256 tokenId;
        address funder;
        uint256 amount;
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

    function publish(IERC721 token, uint256 tokenId, uint256 weiAmount) public {
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
        _withdraw(msg.sender, key);

        emit Unpublished(msg.sender, tokenAddress, tokenId);

        IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    }

    function fund(bytes32 key) public payable exists(key) notOwner(key) {
        require(_escrows[key].state == State.Active, "Should be active");
        uint256 amount = msg.value;
        require(amount == _escrows[key].amount, "Value should be equal token value");

        _escrows[key].state = State.Funded;
        _escrows[key].funder = msg.sender;
        emit Funded(msg.sender, _escrows[key].token, _escrows[key].tokenId, amount);

        _forward(_owners[key]);
    }

    function refund(bytes32 key) public payable exists(key) onlyOwner(key) {
        require(_escrows[key].state == State.Funded, "Should be funded");
        uint256 amount = msg.value;
        require(amount == _escrows[key].amount, "Value should be equal token value");

        _escrows[key].state = State.Refunded;
        emit Refunded(msg.sender, _escrows[key].token, _escrows[key].tokenId, amount);

        _forward(_escrows[key].funder);
    }

    function claim(bytes32 key) public exists(key) onlyLender(key) {
        require(_escrows[key].state == State.Funded, "Should be funded");

        uint256 tokenId = _escrows[key].tokenId;
        address tokenAddress = _escrows[key].token;

        _escrows[key].state = State.Init;
        _escrows[key].amount = 0;
        _escrows[key].funder = address(0);
        _escrows[key].token = address(0);
        _escrows[key].tokenId = 0;
        _withdraw(msg.sender, key);

        emit Claimed(msg.sender, tokenAddress, tokenId);

        IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    }

    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // TODO: change from push to pull approach
    function _forward(address to) internal {
        address(uint160(to)).transfer(msg.value);
    }
}
