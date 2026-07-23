#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{PlayerRegistry, PlayerRegistryClient, PlayerRole, RegistryError};

fn setup() -> (Env, Address, PlayerRegistryClient) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sbt_addr = Address::generate(&env); // In real tests, deploy actual SBT

    let contract_id = env.register_contract(None, PlayerRegistry);
    let client = PlayerRegistryClient::new(&env, &contract_id);

    // Mock the SBT calls
    env.register_stellar_asset_contract(sbt_addr.clone());

    client.init(&sbt_addr, &admin);

    (env, admin, client)
}

#[test]
fn test_init() {
    let (_env, _admin, _client) = setup();
    // Should not panic
}

#[test]
fn test_is_registered_no_player() {
    let (env, _admin, client) = setup();
    let player = Address::generate(&env);

    // Without actual SBT deployed, the cross-contract call will fail.
    // This test validates the contract compiles and init works.
    // Integration tests would use a deployed SBT.
    assert!(!client.is_registered(&player));
}
