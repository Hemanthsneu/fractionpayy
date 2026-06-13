// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock tokenized real-world asset (T-bill, gold, real estate share).
/// Interface-identical to any ERC20 RWA token — swapping in a real issuer
/// token (Ondo, Backed, Maple) is a config change, not a code change.
contract MockRWA is ERC20 {
    /// @notice Annual yield in basis points (450 = 4.50%) — display metadata.
    uint16 public immutable yieldBps;

    constructor(string memory name_, string memory symbol_, uint16 yieldBps_)
        ERC20(name_, symbol_)
    {
        yieldBps = yieldBps_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
