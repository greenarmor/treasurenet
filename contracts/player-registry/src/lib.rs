#![no_std]

extern crate linked_list_allocator;

#[global_allocator]
static ALLOC: linked_list_allocator::LockedHeap = linked_list_allocator::LockedHeap::empty();

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Val,
    Vec,
};

// ─── Storage Keys ────────────────────────────────────────────
const SBT_CONTRACT: Symbol = symbol_short!("sbt_addr");
const ADMIN_KEY: Symbol = symbol_short!("admin");

// ─── Errors ──────────────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RegistryError {
    AlreadyInitialized = 1,
    NotAuthorized = 2,
    NoSoulboundToken = 3,
    InsufficientRole = 4,
    CrossContractFailed = 5,
}

/// Simplified role enum matching the SBT contract.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PlayerRole {
    Player,
    GameMaster,
    Auditor,
}

// ─── Contract ────────────────────────────────────────────────
#[contract]
pub struct PlayerRegistry;

#[contractimpl]
impl PlayerRegistry {
    /// Initialize with the SBT contract address and admin.
    pub fn init(env: Env, sbt_contract: Address, admin: Address) -> Result<(), RegistryError> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(RegistryError::AlreadyInitialized);
        }
        env.storage().instance().set(&SBT_CONTRACT, &sbt_contract);
        env.storage().instance().set(&ADMIN_KEY, &admin);
        Ok(())
    }

    /// Verify that a player holds an SBT with at least the required role.
    pub fn verify_player(
        env: Env,
        player: Address,
        required_role: PlayerRole,
    ) -> Result<bool, RegistryError> {
        let sbt_addr: Address = env
            .storage()
            .instance()
            .get(&SBT_CONTRACT)
            .unwrap();

        let has_token = Self::call_sbt_has_token(&env, &sbt_addr, &player);
        if !has_token {
            return Err(RegistryError::NoSoulboundToken);
        }

        let player_role = Self::call_sbt_role_of(&env, &sbt_addr, &player);
        match (player_role, required_role) {
            (Some(PlayerRole::Auditor), _) => Ok(true),
            (Some(PlayerRole::GameMaster), PlayerRole::GameMaster) => Ok(true),
            (Some(PlayerRole::GameMaster), PlayerRole::Player) => Ok(true),
            (Some(PlayerRole::Player), PlayerRole::Player) => Ok(true),
            _ => Err(RegistryError::InsufficientRole),
        }
    }

    /// Check if a player is registered (has any SBT).
    pub fn is_registered(env: Env, player: Address) -> bool {
        let sbt_addr: Address = env
            .storage()
            .instance()
            .get(&SBT_CONTRACT)
            .unwrap();
        Self::call_sbt_has_token(&env, &sbt_addr, &player)
    }

    /// Get a player's role from their SBT.
    pub fn role_of(env: Env, player: Address) -> Option<PlayerRole> {
        let sbt_addr: Address = env
            .storage()
            .instance()
            .get(&SBT_CONTRACT)
            .unwrap();
        Self::call_sbt_role_of(&env, &sbt_addr, &player)
    }

    /// Update the SBT contract address (admin only).
    pub fn set_sbt_contract(
        env: Env,
        admin: Address,
        sbt_contract: Address,
    ) -> Result<(), RegistryError> {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&ADMIN_KEY).unwrap();
        if admin != stored_admin {
            return Err(RegistryError::NotAuthorized);
        }
        env.storage().instance().set(&SBT_CONTRACT, &sbt_contract);
        Ok(())
    }

    // ─── Cross-contract call helpers ───────────────────────────

    fn call_sbt_has_token(env: &Env, sbt_addr: &Address, player: &Address) -> bool {
        let args: Vec<Val> = Vec::from_array(
            env,
            [player.to_val()],
        );
        env.invoke_contract(sbt_addr, &symbol_short!("has_token"), args)
    }

    fn call_sbt_role_of(env: &Env, sbt_addr: &Address, player: &Address) -> Option<PlayerRole> {
        let args: Vec<Val> = Vec::from_array(
            env,
            [player.to_val()],
        );
        env.invoke_contract(sbt_addr, &symbol_short!("role_of"), args)
    }
}
