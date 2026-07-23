#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{PlayerRole, SbtError, SoulboundToken, SoulboundTokenClient};

fn setup() -> (Env, Address, SoulboundTokenClient) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, SoulboundToken);
    let client = SoulboundTokenClient::new(&env, &contract_id);

    client.init(&admin);

    (env, admin, client)
}

#[test]
fn test_init() {
    let (env, admin, client) = setup();
    assert_eq!(client.admin(), admin);
}

#[test]
fn test_init_twice_fails() {
    let (env, admin, client) = setup();
    let result = client.try_init(&admin);
    assert!(result.is_err());
}

#[test]
fn test_mint_sbt() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    let token_id = client.mint(&admin, &player, &PlayerRole::Player);
    assert_eq!(token_id, 1);
    assert!(client.has_token(&player));
    assert_eq!(client.balance(&player), 1);
    assert_eq!(client.role_of(&player), Some(PlayerRole::Player));
}

#[test]
fn test_mint_duplicate_fails() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.mint(&admin, &player, &PlayerRole::Player);
    let result = client.try_mint(&admin, &player, &PlayerRole::Player);
    assert!(result.is_err());
}

#[test]
fn test_non_admin_cannot_mint() {
    let (env, _admin, client) = setup();
    let player = Address::generate(&env);
    let impostor = Address::generate(&env);

    let result = client.try_mint(&impostor, &player, &PlayerRole::Player);
    assert!(result.is_err());
}

#[test]
fn test_revoke_sbt() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);

    client.mint(&admin, &player, &PlayerRole::Player);
    assert!(client.has_token(&player));

    client.revoke(&admin, &player);
    assert!(!client.has_token(&player));
    assert_eq!(client.balance(&player), 0);
}

#[test]
fn test_transfer_disabled() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);
    let other = Address::generate(&env);

    client.mint(&admin, &player, &PlayerRole::Player);

    let result = client.try_transfer(&player, &other, &1);
    assert!(result.is_err());
}

#[test]
fn test_role_of_no_token() {
    let (env, _admin, client) = setup();
    let player = Address::generate(&env);

    assert_eq!(client.role_of(&player), None);
}

#[test]
fn test_multiple_players() {
    let (env, admin, client) = setup();
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    let id1 = client.mint(&admin, &player1, &PlayerRole::Player);
    let id2 = client.mint(&admin, &player2, &PlayerRole::GameMaster);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert!(client.has_token(&player1));
    assert!(client.has_token(&player2));
}
