#![no_std]

extern crate linked_list_allocator;

#[global_allocator]
static ALLOC: linked_list_allocator::LockedHeap = linked_list_allocator::LockedHeap::empty();

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

// ─── Storage Keys ────────────────────────────────────────────
const ADMIN_KEY: Symbol = symbol_short!("admin");
const BALANCE_KEY: Symbol = symbol_short!("balance");
const TOKEN_COUNT: Symbol = symbol_short!("t_count");
const TOKEN_OWNER: Symbol = symbol_short!("t_owner");
const TOKEN_ROLE: Symbol = symbol_short!("t_role");
const TOKEN_ISSUED: Symbol = symbol_short!("t_issued");

// ─── Player Role ─────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PlayerRole {
    Player,
    GameMaster,
    Auditor,
}

// ─── Errors ──────────────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SbtError {
    AlreadyInitialized = 1,
    NotAuthorized = 2,
    AlreadyHasToken = 3,
    TokenNotFound = 4,
    NotTokenOwner = 5,
    TransferDisabled = 6,
    InvalidRole = 7,
}

// ─── Contract ────────────────────────────────────────────────
#[contract]
pub struct SoulboundToken;

#[contractimpl]
impl SoulboundToken {
    /// Initialize the contract with an admin address.
    pub fn init(env: Env, admin: Address) -> Result<(), SbtError> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(SbtError::AlreadyInitialized);
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&TOKEN_COUNT, &0u64);
        Ok(())
    }

    /// Mint a new Soulbound Token to a player. Only admin can call.
    pub fn mint(
        env: Env,
        admin: Address,
        to: Address,
        role: PlayerRole,
    ) -> Result<u64, SbtError> {
        admin.require_auth();
        Self::check_admin(&env, &admin)?;

        // Check player doesn't already have an SBT
        if env.storage().persistent().has(&(TOKEN_OWNER, to.clone())) {
            return Err(SbtError::AlreadyHasToken);
        }

        let mut count: u64 = env.storage().instance().get(&TOKEN_COUNT).unwrap_or(0);
        let token_id = count + 1;
        count = token_id;
        env.storage().instance().set(&TOKEN_COUNT, &count);

        let now = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&(TOKEN_OWNER, to.clone()), &token_id);

        env.storage()
            .persistent()
            .set(&(BALANCE_KEY, to.clone()), &1i128);

        env.storage()
            .persistent()
            .set(&(TOKEN_ROLE, token_id), &role);

        env.storage()
            .persistent()
            .set(&(TOKEN_ISSUED, token_id), &now);

        env.events().publish(
            (symbol_short!("sbt"), symbol_short!("minted")),
            (token_id, to.clone()),
        );

        Ok(token_id)
    }

    /// Revoke (burn) a player's SBT. Only admin can call.
    pub fn revoke(env: Env, admin: Address, from: Address) -> Result<(), SbtError> {
        admin.require_auth();
        Self::check_admin(&env, &admin)?;

        let token_id: u64 = env
            .storage()
            .persistent()
            .get(&(TOKEN_OWNER, from.clone()))
            .ok_or(SbtError::TokenNotFound)?;

        env.storage().persistent().remove(&(TOKEN_OWNER, from.clone()));
        env.storage().persistent().remove(&(BALANCE_KEY, from.clone()));
        env.storage().persistent().remove(&(TOKEN_ROLE, token_id));
        env.storage().persistent().remove(&(TOKEN_ISSUED, token_id));

        env.events().publish(
            (symbol_short!("sbt"), symbol_short!("revoked")),
            (token_id, from.clone()),
        );

        Ok(())
    }

    /// Check if an address holds an SBT (has a role).
    pub fn has_token(env: Env, player: Address) -> bool {
        env.storage().persistent().has(&(TOKEN_OWNER, player))
    }

    /// Get the balance of SBT tokens for an address (0 or 1).
    pub fn balance(env: Env, owner: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&(BALANCE_KEY, owner))
            .unwrap_or(0)
    }

    /// Get the token ID owned by an address.
    pub fn token_of(env: Env, owner: Address) -> Option<u64> {
        env.storage().persistent().get(&(TOKEN_OWNER, owner))
    }

    /// Get the role associated with a token.
    pub fn get_role(env: Env, token_id: u64) -> Option<PlayerRole> {
        env.storage().persistent().get(&(TOKEN_ROLE, token_id))
    }

    /// Get the role of a player by their address.
    pub fn role_of(env: Env, player: Address) -> Option<PlayerRole> {
        let token_id: u64 = env.storage().persistent().get(&(TOKEN_OWNER, player))?;
        env.storage().persistent().get(&(TOKEN_ROLE, token_id))
    }

    /// Get the admin address.
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN_KEY).unwrap()
    }

    /// Transfer is always disabled for SBT.
    pub fn transfer(
        _env: Env,
        _from: Address,
        _to: Address,
        _amount: i128,
    ) -> Result<(), SbtError> {
        Err(SbtError::TransferDisabled)
    }

    // ─── Helpers ────────────────────────────────────────────────

    fn check_admin(env: &Env, addr: &Address) -> Result<(), SbtError> {
        let stored_admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
        if *addr != stored_admin {
            return Err(SbtError::NotAuthorized);
        }
        Ok(())
    }
}
