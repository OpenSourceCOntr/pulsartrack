#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env};

#[test]
fn test_proposal_expiration() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let voting_period = 100; // ledgers
    let grace_period = 3600; // 1 hour in seconds

    let contract_id = env.register_contract(None, GovernanceDaoContract);
    let client = GovernanceDaoContractClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &token,
        &voting_period,
        &grace_period,
        &0,
        &51,
        &0,
    );

    let proposer = Address::generate(&env);
    let proposal_id = client.create_proposal(
        &proposer,
        &String::from_str(&env, "Test Proposal"),
        &String::from_str(&env, "Description"),
        &None,
    );

    // Initial status should be Active
    assert!(client.get_proposal_status(&proposal_id) == ProposalStatus::Active);

    // Advance time past end_time + grace_period
    // 100 ledgers * 5s = 500s + 3600s = 4100s
    env.ledger().with_mut(|li| {
        li.timestamp += 4200;
        li.sequence_number += 105;
    });

    // live status should be Expired
    assert!(client.get_proposal_status(&proposal_id) == ProposalStatus::Expired);

    // finalize_proposal should auto-reject
    client.finalize_proposal(&proposal_id);
    
    let proposal = client.get_proposal(&proposal_id).unwrap();
    assert!(proposal.status == ProposalStatus::Rejected);
}
