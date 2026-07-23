#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token, Address, Env,
    };

    fn setup_test() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let admin = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_client = token::StellarAssetClient::new(&env, &token.address());
        token_client.mint(&admin, &(1000 * 10_000_000i128));

        (env, admin, token.address(), token_admin)
    }

    #[test]
    fn test_create_and_fund_hunt() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let hunt_id = client.create_hunt(&admin, &token, &(100i128 * 10_000_000), &3600);
        assert_eq!(hunt_id, 1);

        let info = client.get_hunt(&1);
        assert_eq!(info.status, HuntStatus::Created);
        assert_eq!(info.reward, 100i128 * 10_000_000);
        assert_eq!(info.owner, admin);

        client.fund_hunt(&1);
        let info = client.get_hunt(&1);
        assert_eq!(info.status, HuntStatus::Funded);
    }

    #[test]
    fn test_activate_and_claim() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let player = Address::generate(&env);
        let hunt_id = client.create_hunt(&admin, &token, &(50i128 * 10_000_000), &3600);
        client.fund_hunt(&hunt_id);
        client.activate_hunt(&hunt_id);

        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Active);

        let result = client.claim_reward(&hunt_id, &player);
        assert_eq!(result.reward, 50i128 * 10_000_000);

        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Completed);
        assert_eq!(info.winner, Some(player));
    }

    #[test]
    fn test_double_claim_prevented() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let player1 = Address::generate(&env);
        let player2 = Address::generate(&env);
        let hunt_id = client.create_hunt(&admin, &token, &(50i128 * 10_000_000), &3600);
        client.fund_hunt(&hunt_id);
        client.activate_hunt(&hunt_id);

        client.claim_reward(&hunt_id, &player1);
        let result = client.try_claim_reward(&hunt_id, &player2);
        assert!(result.is_err());
    }

    #[test]
    fn test_refund_on_expiry() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let hunt_id = client.create_hunt(&admin, &token, &(50i128 * 10_000_000), &3600);
        client.fund_hunt(&hunt_id);
        client.activate_hunt(&hunt_id);

        // Advance time past expiry
        env.ledger().with_mut(|li| {
            li.timestamp = li.timestamp + 7200;
        });

        client.refund(&hunt_id);

        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Refunded);
    }

    #[test]
    fn test_pause_and_resume() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let player = Address::generate(&env);
        let hunt_id = client.create_hunt(&admin, &token, &(50i128 * 10_000_000), &3600);
        client.fund_hunt(&hunt_id);
        client.activate_hunt(&hunt_id);

        client.pause(&hunt_id);
        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Paused);

        // Cannot claim while paused
        let result = client.try_claim_reward(&hunt_id, &player);
        assert!(result.is_err());

        client.resume(&hunt_id);
        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Active);

        client.claim_reward(&hunt_id, &player);
    }

    #[test]
    fn test_cancel_before_activation() {
        let (env, admin, token, _) = setup_test();
        let contract_id = env.register_contract(None, TreasureHunt);
        let client = TreasureHuntClient::new(&env, &contract_id);
        client.init();

        let hunt_id = client.create_hunt(&admin, &token, &(50i128 * 10_000_000), &3600);
        client.fund_hunt(&hunt_id);
        client.cancel(&hunt_id);

        let info = client.get_hunt(&hunt_id);
        assert_eq!(info.status, HuntStatus::Cancelled);
    }
}
