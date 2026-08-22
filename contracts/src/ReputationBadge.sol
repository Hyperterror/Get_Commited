// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationBadge
/// @notice Soulbound ERC1155 reputation badges minted by GetCommitted
///         Non-transferable: only mint (from==0) and burn (to==0) are allowed
contract ReputationBadge is ERC1155, Ownable {

    address public minter; // only GetCommitted contract can mint

    // Badge types:
    // 1 = Novice Committer     (Level 1)
    // 2 = Focused Builder      (Level 2)
    // 3 = Deep Work Master     (Level 3)
    // 4 = Monad Monk           (Level 4)

    mapping(uint256 => string) private _badgeURIs;

    event BadgeMinted(address indexed to, uint256 indexed badgeType, uint256 tokenId);
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    error OnlyMinter();
    error SoulboundNonTransferable();

    constructor() ERC1155("") Ownable(msg.sender) {}

    // ─────────────────────────────────────────────────────────
    //  MINT (called only by GetCommitted.sol)
    // ─────────────────────────────────────────────────────────

    /// @notice Mint a soulbound badge to a recipient
    /// @param to        Recipient address
    /// @param badgeType Badge type ID (1–4 for levels; future types can be added)
    function mint(address to, uint256 badgeType) external {
        if (msg.sender != minter) revert OnlyMinter();
        _mint(to, badgeType, 1, "");
        emit BadgeMinted(to, badgeType, badgeType);
    }

    // ─────────────────────────────────────────────────────────
    //  SOULBOUND — block all transfers (not mint/burn)
    // ─────────────────────────────────────────────────────────

    /// @dev Override _update (OZ v5) to enforce soulbound constraint.
    ///      Mint: from == address(0) ✓
    ///      Burn: to   == address(0) ✓
    ///      Transfer: both non-zero   ✗ reverts
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0) && to != address(0)) revert SoulboundNonTransferable();
        super._update(from, to, ids, values);
    }

    // ─────────────────────────────────────────────────────────
    //  METADATA
    // ─────────────────────────────────────────────────────────

    function uri(uint256 badgeType) public view override returns (string memory) {
        return _badgeURIs[badgeType];
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────

    function setMinter(address _minter) external onlyOwner {
        emit MinterUpdated(minter, _minter);
        minter = _minter;
    }

    function setBadgeURI(uint256 badgeType, string calldata _uri) external onlyOwner {
        _badgeURIs[badgeType] = _uri;
    }
}
