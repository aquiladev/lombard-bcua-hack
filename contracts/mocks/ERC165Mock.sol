pragma solidity ^0.5.2;

import "./../../client/node_modules/openzeppelin-solidity/contracts/introspection/IERC165.sol";

contract ERC165Mock is IERC165  {
    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return false;
    }
}
