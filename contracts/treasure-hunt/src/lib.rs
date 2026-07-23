#![no_std]

extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

// ─── Storage Keys ────────────────────────────────────────────
const HUNT_COUNT: Symbol = symbol_short!("h_count");
const HUNT_OWNER: Symbol = symbol_short!("h_owner");
const HUNT_STATUS: Symbol = symbol_short!("h_stat");
const HUNT_REWARD: Symbol = symbol_short!("h_reward");
const HUNT_TOKEN: Symbol = symbol_short!("h_token");
const HUNT_EXPIRY: Symbol = symbol_short!("h_exp");
const HUNT_WINNER: Symbol = symbol_short!("h_winner");
const HUNT_PAUSED: Symbol = symbol_short!("h_paused");

// ─── Hunt Status ─────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HuntStatus {
    Created,
    Funded,
    Active,
    Paused,
    Completed,
    Expired,
    Refunded,
    Cancelled,
}

// ─── Hunt Data ───────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug)]
pub struct HuntInfo {
    pub id: u64,
    pub owner: Address,
    pub status: HuntStatus,
    pub reward: i128,
    pub token: Address,
    pub expires_at: u64,
    pub winner: Option<Address>,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ClaimResult {
    pub winner: Address,
    pub reward: i128,
}

// ─── Events ──────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug)]
pub enum HuntEvent {
    Created(u64, Address),
    Funded(u64, i128),
    Activated(u64),
    Claimed(u64, Address, i128),
    Refunded(u64, Address),
    Expired(u64),
    Paused(u64),
    Resumed(u64),
    Cancelled(u64),
}

// ─── Errors ──────────────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum HuntError {
    AlreadyExists = 1,
    NotFound = 2,
    NotOwner = 3,
    InsufficientFunds = 4,
    AlreadyActive = 5,
    NotActive = 6,
    Expired = 7,
    AlreadyClaimed = 8,
    NotPaused = 9,
    AlreadyPaused = 10,
    CannotCancel = 11,
    TransferFailed = 12,
    InvalidStatus = 13,
}

// ─── Contract ────────────────────────────────────────────────
#[contract]
pub struct TreasureHunt;

#[contractimpl]
impl TreasureHunt {
    /// Initialize the contract with an empty hunt counter.
    pub fn init(env: Env) {
        if env.storage().instance().has(&HUNT_COUNT) {
            return;
        }
        env.storage().instance().set(&HUNT_COUNT, &0u64);
    }

    /// Create a new treasure hunt. Returns the hunt ID.
    pub fn create_hunt(
        env: Env,
        owner: Address,
        token: Address,
        reward: i128,
        expiration_seconds: u64,
    ) -> Result<u64, HuntError> {
        owner.require_auth();
        if reward <= 0 {
            return Err(HuntError::InsufficientFunds);
        }

        let mut count: u64 = env.storage().instance().get(&HUNT_COUNT).unwrap_or(0);
        let hunt_id = count + 1;
        count = hunt_id;
        env.storage().instance().set(&HUNT_COUNT, &count);

        let hunt_key = Self::hunt_key(&env, hunt_id);

        env.storage().persistent().set(&(hunt_key.clone(), HUNT_OWNER), &owner.clone());
        env.storage().persistent().set(&(hunt_key.clone(), HUNT_STATUS), &HuntStatus::Created);
        env.storage().persistent().set(&(hunt_key.clone(), HUNT_REWARD), &reward);
        env.storage().persistent().set(&(hunt_key.clone(), HUNT_TOKEN), &token);
        env.storage()
            .persistent()
            .set(&(hunt_key.clone(), HUNT_EXPIRY), &(env.ledger().timestamp() + expiration_seconds));
        env.storage().persistent().set(&(hunt_key, HUNT_PAUSED), &false);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("created")),
            HuntEvent::Created(hunt_id, owner.clone()),
        );

        Ok(hunt_id)
    }

    /// Fund the escrow for a hunt. Transfers tokens from owner to contract.
    pub fn fund_hunt(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        owner.require_auth();

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Created {
            return Err(HuntError::InvalidStatus);
        }

        let reward: i128 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_REWARD))
            .ok_or(HuntError::NotFound)?;

        let token: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_TOKEN))
            .ok_or(HuntError::NotFound)?;

        let token_client = token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();

        token_client.transfer(&owner, &contract_address, &reward);

        env.storage()
            .persistent()
            .set(&(hunt_key.clone(), HUNT_STATUS), &HuntStatus::Funded);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("funded")),
            HuntEvent::Funded(hunt_id, reward),
        );

        Ok(())
    }

    /// Activate the hunt so players can start playing.
    pub fn activate_hunt(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        owner.require_auth();

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Funded {
            return Err(HuntError::InvalidStatus);
        }

        env.storage()
            .persistent()
            .set(&(hunt_key, HUNT_STATUS), &HuntStatus::Active);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("activated")),
            HuntEvent::Activated(hunt_id),
        );

        Ok(())
    }

    /// Claim the treasure reward. Only callable by the backend after GPS + anti-cheat validation.
    pub fn claim_reward(env: Env, hunt_id: u64, winner: Address) -> Result<ClaimResult, HuntError> {
        // In production, this would be callable only by an authorized backend oracle
        // that has validated GPS coordinates and anti-cheat checks off-chain.
        // For now, we allow direct claims with the winner's signature.
        winner.require_auth();

        let hunt_key = Self::hunt_key(&env, hunt_id);

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Active {
            return Err(HuntError::NotActive);
        }

        let expiry: u64 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_EXPIRY))
            .ok_or(HuntError::NotFound)?;

        if env.ledger().timestamp() > expiry {
            return Err(HuntError::Expired);
        }

        let existing_winner: Option<Address> = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_WINNER))
            .unwrap_or(None);

        if existing_winner.is_some() {
            return Err(HuntError::AlreadyClaimed);
        }

        let reward: i128 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_REWARD))
            .ok_or(HuntError::NotFound)?;

        let token: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_TOKEN))
            .ok_or(HuntError::NotFound)?;

        let token_client = token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();

        token_client.transfer(&contract_address, &winner, &reward);

        env.storage()
            .persistent()
            .set(&(hunt_key.clone(), HUNT_STATUS), &HuntStatus::Completed);
        env.storage()
            .persistent()
            .set(&(hunt_key.clone(), HUNT_WINNER), &Some(winner.clone()));

        let result = ClaimResult {
            winner: winner.clone(),
            reward,
        };

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("claimed")),
            HuntEvent::Claimed(hunt_id, winner, reward),
        );

        Ok(result)
    }

    /// Refund the Game Master if the hunt expired without a winner.
    pub fn refund(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Active && status != HuntStatus::Funded {
            return Err(HuntError::InvalidStatus);
        }

        let expiry: u64 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_EXPIRY))
            .ok_or(HuntError::NotFound)?;

        if env.ledger().timestamp() <= expiry {
            return Err(HuntError::NotActive); // Not yet expired
        }

        let reward: i128 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_REWARD))
            .ok_or(HuntError::NotFound)?;

        let token: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_TOKEN))
            .ok_or(HuntError::NotFound)?;

        let token_client = token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();

        token_client.transfer(&contract_address, &owner, &reward);

        env.storage()
            .persistent()
            .set(&(hunt_key, HUNT_STATUS), &HuntStatus::Refunded);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("refunded")),
            HuntEvent::Refunded(hunt_id, owner.clone()),
        );

        Ok(())
    }

    /// Pause an active hunt.
    pub fn pause(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        owner.require_auth();

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Active {
            return Err(HuntError::NotActive);
        }

        let paused: bool = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_PAUSED))
            .unwrap_or(false);

        if paused {
            return Err(HuntError::AlreadyPaused);
        }

        env.storage().persistent().set(&(hunt_key.clone(), HUNT_PAUSED), &true);
        env.storage().persistent().set(&(hunt_key.clone(), HUNT_STATUS), &HuntStatus::Paused);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("paused")),
            HuntEvent::Paused(hunt_id),
        );

        Ok(())
    }

    /// Resume a paused hunt.
    pub fn resume(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        owner.require_auth();

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status != HuntStatus::Paused {
            return Err(HuntError::NotPaused);
        }

        env.storage().persistent().set(&(hunt_key.clone(), HUNT_PAUSED), &false);
        env.storage().persistent().set(&(hunt_key.clone(), HUNT_STATUS), &HuntStatus::Active);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("resumed")),
            HuntEvent::Resumed(hunt_id),
        );

        Ok(())
    }

    /// Cancel a hunt before it's activated.
    pub fn cancel(env: Env, hunt_id: u64) -> Result<(), HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);
        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        owner.require_auth();

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        if status == HuntStatus::Active || status == HuntStatus::Completed {
            return Err(HuntError::CannotCancel);
        }

        // If funded, refund first
        if status == HuntStatus::Funded {
            let reward: i128 = env
                .storage()
                .persistent()
                .get(&(hunt_key.clone(), HUNT_REWARD))
                .ok_or(HuntError::NotFound)?;

            let token: Address = env
                .storage()
                .persistent()
                .get(&(hunt_key.clone(), HUNT_TOKEN))
                .ok_or(HuntError::NotFound)?;

            let token_client = token::Client::new(&env, &token);
            let contract_address = env.current_contract_address();
            token_client.transfer(&contract_address, &owner, &reward);
        }

        env.storage()
            .persistent()
            .set(&(hunt_key, HUNT_STATUS), &HuntStatus::Cancelled);

        env.events().publish(
            (symbol_short!("hunt"), symbol_short!("cancelled")),
            HuntEvent::Cancelled(hunt_id),
        );

        Ok(())
    }

    /// Get hunt info.
    pub fn get_hunt(env: Env, hunt_id: u64) -> Result<HuntInfo, HuntError> {
        let hunt_key = Self::hunt_key(&env, hunt_id);

        let owner: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_OWNER))
            .ok_or(HuntError::NotFound)?;

        let status: HuntStatus = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_STATUS))
            .unwrap_or(HuntStatus::Created);

        let reward: i128 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_REWARD))
            .ok_or(HuntError::NotFound)?;

        let token: Address = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_TOKEN))
            .ok_or(HuntError::NotFound)?;

        let expires_at: u64 = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_EXPIRY))
            .ok_or(HuntError::NotFound)?;

        let winner: Option<Address> = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_WINNER))
            .unwrap_or(None);

        let paused: bool = env
            .storage()
            .persistent()
            .get(&(hunt_key.clone(), HUNT_PAUSED))
            .unwrap_or(false);

        Ok(HuntInfo {
            id: hunt_id,
            owner,
            status,
            reward,
            token,
            expires_at,
            winner,
            paused,
        })
    }

    /// Get total hunt count.
    pub fn hunt_count(env: Env) -> u64 {
        env.storage().instance().get(&HUNT_COUNT).unwrap_or(0)
    }

    // ─── Helpers ──────────────────────────────────────────────

    fn hunt_key(env: &Env, hunt_id: u64) -> Symbol {
        Symbol::new(env, &alloc::format!("h_{}", hunt_id))
    }
}

// ─── Allocator for format! macro ─────────────────────────────
mod alloc {
    extern crate alloc;
    pub use alloc::format;
}
