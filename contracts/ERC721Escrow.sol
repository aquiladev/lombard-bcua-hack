pragma solidity ^0.5.2;

import "./../client/node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "./IERC721Escrow.sol";

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