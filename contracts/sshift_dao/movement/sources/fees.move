module sshift_dao_addr::fees_beta_1 {
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use std::error;

    use aptos_framework::event;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object;

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOLLECTOR_NOT_FOUND: u64 = 2;
    const ENOTHING_TO_CLAIM: u64 = 4;
    const EFEES_SET_AMOUNT_HIGHER_THAN_BALANCE: u64 = 5;
    const ENOT_RESOURCE_ACCOUNT_ADDED: u64 = 6;
    const EONLY_ADMIN_CAN_SET_PENDING_ADMIN: u64 = 7;
    const EONLY_REVIEWER_CAN_SET_PENDING_REVIEWER: u64 = 8;
    const ENOT_PENDING_ADMIN: u64 = 9;
    const ENOT_PENDING_REVIEWER: u64 = 10;
    const ENOT_CURRENCY_SET: u64 = 11;

    struct Config has key {
        admin_addr: address,
        pending_admin_addr: Option<address>,
        reviewer_addr: address,
        pending_reviewer_addr: Option<address>,
        currency: Option<address>,
    }

    struct FeesAdmin has key {
        signer_cap: Option<SignerCapability>,
        salary_not_claimed: u64,
        collectors: vector<address>,
    }

    struct FeesToClaim has key {
        amount: u64
    }

    #[event]
    struct Claimed has store, drop {
        collector: address,
        amount: u64
    }

    fun init_module(sender: &signer) {
        move_to(
            sender,
            Config {
                admin_addr: signer::address_of(sender),
                pending_admin_addr: option::none(),
                reviewer_addr: signer::address_of(sender),
                pending_reviewer_addr: option::none(),
                currency: option::none(),
            }
        );

        move_to(
            sender,
            FeesAdmin {
                collectors: vector::empty(),
                salary_not_claimed: 0,
                signer_cap: option::none(),
            }
        );
    }

    public entry fun create_resource_account(
        account: &signer, seed: vector<u8>, collectors: vector<address>
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let config = borrow_global<Config>(@sshift_dao_addr);

        assert!(
            is_admin(config, account_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let (_resource_signer, signer_cap) =
            account::create_resource_account(account, seed);

        fees_admin.signer_cap = option::some(signer_cap);

        vector::for_each<address>(
            collectors,
            |account| {
                vector::push_back(&mut fees_admin.collectors, account);
            }
        );
    }

    public entry fun remove_resource_account(
        account: &signer, reviewer: &signer
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_dao_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        fees_admin.signer_cap = option::none();
    }

    public entry fun create_collector_object(account: &signer) acquires FeesAdmin {
        let account_addr = signer::address_of(account);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let (is_found, _index) = vector::find(
            &fees_admin.collectors, |collector| collector == &account_addr
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        move_to(account, FeesToClaim { amount: 0 });
    }

    public entry fun add_collector(
        account: &signer, reviewer: &signer, collector: address
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_dao_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );
        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        vector::push_back(&mut fees_admin.collectors, collector);
    }

    public entry fun remove_collector(
        account: &signer, reviewer: &signer, collector: address
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_dao_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let (is_found, index) = vector::find<address>(
            &fees_admin.collectors, |c| { c == &collector }
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        vector::remove<address>(&mut fees_admin.collectors, index);
    }

    public entry fun claim_salary(account: &signer) acquires FeesAdmin, FeesToClaim, Config {
        let account_addr = signer::address_of(account);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let (is_found, _index) = vector::find<address>(
            &fees_admin.collectors, |c| { c == &account_addr }
        );

        let config = borrow_global<Config>(@sshift_dao_addr);

        assert!(option::is_some(&config.currency), ENOT_CURRENCY_SET);

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        let salary_to_claim = borrow_global_mut<FeesToClaim>(account_addr);

        assert!(salary_to_claim.amount > 0, error::invalid_state(ENOTHING_TO_CLAIM));

        let signer_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(signer_cap);

        let currency = option::borrow(&config.currency);

        let metadata = object::address_to_object<Metadata>(*currency);

        primary_fungible_store::transfer(
            &resource_signer, metadata, account_addr, salary_to_claim.amount 
        );

        fees_admin.salary_not_claimed = fees_admin.salary_not_claimed
            - salary_to_claim.amount;

        event::emit(
            Claimed { collector: account_addr, amount: salary_to_claim.amount }
        );

        salary_to_claim.amount = 0;
    }

    public entry fun payment(
        account: &signer, collectors: vector<address>, amounts: vector<u64>,
    ) acquires FeesAdmin, Config, FeesToClaim {
        let account_addr = signer::address_of(account);
        let config = borrow_global<Config>(@sshift_dao_addr);
        assert!(
            is_admin(config, account_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let (is_found, _index) = vector::find<address>(
            &fees_admin.collectors,
            |c| {
                vector::any(&collectors, |e| e == c)
            }
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        let signer_cap = get_signer_cap(&fees_admin.signer_cap);
        let resource_signer = account::create_signer_with_capability(signer_cap);

        let currency = option::borrow(&config.currency);

        let metadata = object::address_to_object<Metadata>(*currency);

        assert!(
            primary_fungible_store::balance(signer::address_of(&resource_signer), metadata)
                > vector::fold(amounts, 0, |curr, acc| acc + curr)
                    + fees_admin.salary_not_claimed,
            error::invalid_state(EFEES_SET_AMOUNT_HIGHER_THAN_BALANCE)
        );

        vector::for_each(
            collectors,
            |e| {
                let (_has_amount, index) = vector::index_of(&collectors, &e);

                let amount = *vector::borrow<u64>(&amounts, index);

                let salary_to_claim = borrow_global_mut<FeesToClaim>(e);

                salary_to_claim.amount = amount;

                fees_admin.salary_not_claimed = fees_admin.salary_not_claimed + amount;
            }
        );
    }

    public entry fun set_pending_admin(sender: &signer, new_admin: address) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_dao_addr);
        assert!(is_admin(config, sender_addr), EONLY_ADMIN_CAN_SET_PENDING_ADMIN);
        config.pending_admin_addr = option::some(new_admin);
    }

    public entry fun accept_admin(sender: &signer) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_dao_addr);
        assert!(
            config.pending_admin_addr == option::some(sender_addr), ENOT_PENDING_ADMIN
        );
        config.admin_addr = sender_addr;
        config.pending_admin_addr = option::none();
    }

    public entry fun set_pending_reviewer(
        sender: &signer, new_admin: address
    ) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_dao_addr);
        assert!(
            is_reviewer(config, sender_addr), EONLY_REVIEWER_CAN_SET_PENDING_REVIEWER
        );
        config.pending_reviewer_addr = option::some(new_admin);
    }

    public entry fun accept_reviewer(sender: &signer) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_dao_addr);
        assert!(
            config.pending_reviewer_addr == option::some(sender_addr),
            ENOT_PENDING_REVIEWER
        );
        config.reviewer_addr = sender_addr;
        config.pending_reviewer_addr = option::none();
    }

    public entry fun set_currency(sender: &signer, currency: address) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_dao_addr);
        assert!(is_admin(config, sender_addr), EONLY_ADMIN_CAN_SET_PENDING_ADMIN);

        config.currency = option::some(currency);
    }

    #[view]
    /// Get contract admin
    public fun get_admin(): address acquires Config {
        let config = borrow_global<Config>(@sshift_dao_addr);
        config.admin_addr
    }

    #[view]
    /// Get contract reviewer
    public fun get_reviewer(): address acquires Config {
        let config = borrow_global<Config>(@sshift_dao_addr);
        config.reviewer_addr
    }

    #[view]
    /// Get contract pending admin
    public fun get_pending_admin(): address acquires Config {
        let config = borrow_global<Config>(@sshift_dao_addr);
        *option::borrow(&config.pending_admin_addr)
    }

    #[view]
    /// Get contract reviewer
    public fun get_pending_reviewer(): address acquires Config {
        let config = borrow_global<Config>(@sshift_dao_addr);
        *option::borrow(&config.pending_reviewer_addr)
    }

    #[view]
    public fun get_collectors(): vector<address> acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_dao_addr);

        fees_admin.collectors
    }

    #[view]
    public fun get_currency_addr(): address acquires Config {
        let config = borrow_global<Config>(@sshift_dao_addr);
        *option::borrow(&config.currency)
    }


    #[view]
    public fun get_resource_balance(): u64 acquires FeesAdmin, Config {
        let config = borrow_global<Config>(@sshift_dao_addr);

        assert!(option::is_some(&config.currency), ENOT_CURRENCY_SET);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let resource_signer_addr = signer::address_of(&resource_signer);

        let currency = option::borrow(&config.currency);

        let metadata = object::address_to_object<Metadata>(*currency);

        primary_fungible_store::balance(resource_signer_addr, metadata)
    }

    #[view]
    public fun check_collector_object(account_addr: address): bool {
        exists<FeesToClaim>(account_addr)
    }

    #[view]
    public fun get_balance_to_claim(account_addr: address): u64 acquires FeesToClaim {
        let fees_to_claim = borrow_global<FeesToClaim>(account_addr);
        fees_to_claim.amount
    }

    #[view]
    public fun resource_account_exists(): bool acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_dao_addr);
        option::is_some(&fees_admin.signer_cap)
    }

    #[view]
    public fun get_resource_account_address(): address acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_dao_addr);
        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let resource_signer_addr = signer::address_of(&resource_signer);

        resource_signer_addr
    }

    fun is_admin(config: &Config, sender: address): bool {
        if (sender == config.admin_addr) { true }
        else { false }
    }

    fun is_reviewer(config: &Config, sender: address): bool {
        if (sender == config.reviewer_addr) { true }
        else { false }
    }

    fun get_signer_cap(signer_cap_opt: &Option<SignerCapability>): &SignerCapability {
        assert!(
            option::is_some<SignerCapability>(signer_cap_opt),
            error::not_implemented(ENOT_RESOURCE_ACCOUNT_ADDED)
        );
        option::borrow<SignerCapability>(signer_cap_opt)
    }

    #[test_only]
    use aptos_framework::aptos_coin::{Self, AptosCoin};

    #[test_only]
    use aptos_framework::timestamp;

    #[test_only]
    use aptos_framework::coin;

    #[test_only]
    use aptos_framework::object::{Object};

    #[test_only]
    use std::string;

    #[test_only]
    use aptos_std::math64;

    #[test_only]
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef};

    #[test_only]
    const EBALANCE_NOT_EQUAL: u64 = 18;

    #[test_only]
    const Ecollector_SHOULD_NOT_EXISTS: u64 = 19;

    #[test_only]
    const ESIGN_CAP_SHOULD_NOT_EXISTS: u64 = 20;

    #[test_only]
    struct FAController has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
    }

    #[test_only]
    public fun initialize_for_test(sender: &signer) {
        move_to(
            sender,
            Config {
                admin_addr: signer::address_of(sender),
                pending_admin_addr: option::none(),
                reviewer_addr: signer::address_of(sender),
                pending_reviewer_addr: option::none(),
                currency: option::none(),
            }
        );

        move_to(
            sender,
            FeesAdmin {
                collectors: vector::empty(),
                salary_not_claimed: 0,
                signer_cap: option::none()
            }
        );
    }

    #[test_only]
    fun create_fa(): Object<Metadata> {
        let fa_owner_obj_constructor_ref = &object::create_object(@sshift_dao_addr);
        let fa_owner_obj_signer = &object::generate_signer(fa_owner_obj_constructor_ref);

        let name = string::utf8(b"usdt test");

        let fa_obj_constructor_ref = &object::create_named_object(
            fa_owner_obj_signer,
            *string::bytes(&name),
        );

        let fa_obj_signer = &object::generate_signer(fa_obj_constructor_ref);


        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            fa_obj_constructor_ref,
            option::none(),
            name,
            string::utf8(b"USDT"),
            8,
            string::utf8(b"test"),
            string::utf8(b"usdt_project"),
        );

        let fa_obj = object::object_from_constructor_ref<Metadata>(fa_obj_constructor_ref);

        let mint_ref = fungible_asset::generate_mint_ref(fa_obj_constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(fa_obj_constructor_ref);

        move_to(fa_obj_signer, FAController {
            mint_ref,
            transfer_ref,
        });

        fa_obj
    }

    #[test_only]
    fun mint_fa(sender: &signer, mint_ref: &MintRef, amount: u64) {
        let account_addr = signer::address_of(sender);

        primary_fungible_store::mint(mint_ref, account_addr, amount);
    }

    #[test_only]
    fun bounded_percentage(amount: u64, numerator: u64, denominator: u64): u64 {
        if (denominator == 0) { 0 }
        else {
            math64::min(
                amount,
                math64::mul_div(amount, numerator, denominator)
            )
        }
    }

    #[
        test(
            aptos_framework = @0x1,
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_payment(
        aptos_framework: &signer,
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config, FeesAdmin, FeesToClaim, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        // current timestamp is 0 after initialization
        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        coin::register<AptosCoin>(user1);
        coin::register<AptosCoin>(user2);

        aptos_coin::mint(aptos_framework, user1_addr, 20000000);

        init_module(sender);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        create_resource_account(user1, b"test", vector[user3_addr, user4_addr]);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_dao_addr);

        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let fa_obj = create_fa();
        
        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(&resource_signer, &fa_controller.mint_ref, 20000000);

        set_currency(user1, fa_addr);

        let resource_balance = get_resource_balance();

        assert!(resource_balance == 20000000, EBALANCE_NOT_EQUAL);

        add_collector(user1, user4, user2_addr);
        create_collector_object(user2);
        add_collector(user1, user4, user3_addr);
        create_collector_object(user3);
        add_collector(user1, user4, user4_addr);
        create_collector_object(user4);

        payment(
            user1,
            vector[user2_addr, user3_addr, user4_addr],
            vector[2000000, 1000000, 1500000]
        );

        let user2_addr_balance = get_balance_to_claim(user2_addr);
        let user3_addr_balance = get_balance_to_claim(user3_addr);
        let user4_addr_balance = get_balance_to_claim(user4_addr);

        assert!(user2_addr_balance == 2000000, EBALANCE_NOT_EQUAL);
        assert!(user3_addr_balance == 1000000, EBALANCE_NOT_EQUAL);
        assert!(user4_addr_balance == 1500000, EBALANCE_NOT_EQUAL);

        claim_salary(user3);

        let resource_balance_after_user3_claimed = get_resource_balance();
        let user3_addr_balance_after_claimed = get_balance_to_claim(user3_addr);
        let user4_addr_balance_after_user3_claimed = get_balance_to_claim(user4_addr);
        let user2_addr_balance_after_user3_claimed = get_balance_to_claim(user2_addr);

        assert!(user3_addr_balance_after_claimed == 0, EBALANCE_NOT_EQUAL);
        assert!(
            resource_balance_after_user3_claimed
                == resource_balance - user3_addr_balance,
            EBALANCE_NOT_EQUAL
        );
        assert!(user4_addr_balance_after_user3_claimed == 1500000, EBALANCE_NOT_EQUAL);
        assert!(user2_addr_balance_after_user3_claimed == 2000000, EBALANCE_NOT_EQUAL);

        claim_salary(user4);

        let user4_addr_balance_after_claimed = get_balance_to_claim(user4_addr);
        let resource_balance_after_user4_claimed = get_resource_balance();

        assert!(user4_addr_balance_after_claimed == 0, EBALANCE_NOT_EQUAL);
        assert!(
            resource_balance_after_user4_claimed
                == resource_balance - (user3_addr_balance + user4_addr_balance),
            EBALANCE_NOT_EQUAL
        );

        assert!(primary_fungible_store::balance(user2_addr, fa_obj) == 0, EBALANCE_NOT_EQUAL);
        assert!(primary_fungible_store::balance(user3_addr, fa_obj) == 1000000, EBALANCE_NOT_EQUAL);
        assert!(primary_fungible_store::balance(user4_addr, fa_obj) == 1500000, EBALANCE_NOT_EQUAL);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_add_collector(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        add_collector(user1, user4, user4_addr);

        let collectors = get_collectors();

        let (is_found, _index) = vector::find<address>(
            &collectors, |c| { c == &user4_addr }
        );

        assert!(is_found, ECOLLECTOR_NOT_FOUND);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_remove_collector(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );
        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_collector(user1, user4, user4_addr);

        let collectors = get_collectors();

        let (is_found, _index) = vector::find<address>(
            &collectors, |c| { c == &user4_addr }
        );

        assert!(!is_found, Ecollector_SHOULD_NOT_EXISTS);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_remove_resource_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_resource_account(user1, user4);

        let fees_admin = borrow_global<FeesAdmin>(@sshift_dao_addr);

        assert!(&fees_admin.signer_cap == &option::none(), ESIGN_CAP_SHOULD_NOT_EXISTS);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_add_collector_with_not_admin_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {

        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        add_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_add_collector_with_not_reviewer_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {

        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        add_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_collector_with_not_admin_accout(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_collector_with_not_reviewer_accout(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        remove_collector(user1, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_payment_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config, FeesToClaim {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        payment(
            user4,
            vector[user2_addr, user3_addr],
            vector[2000000, 1000000]
        );
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 393218, location = Self)]
    fun test_claim_fees_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config, FeesToClaim, FAController {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user4, &fa_controller.mint_ref, 2000);

        set_currency(user1, fa_addr);

        claim_salary(user4);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 7, location = Self)]
    fun test_set_pending_admin_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_admin(user4, user1_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 9, location = Self)]
    fun test_accept_admin_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_admin(sender, user1_addr);

        accept_admin(user4);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 8, location = Self)]
    fun test_set_pending_reviewer_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_reviewer(user4, user1_addr);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 10, location = Self)]
    fun test_accept_reviewer_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_reviewer(sender, user1_addr);

        accept_reviewer(user4);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_resource_account_with_not_admin_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_resource_account(user2, user4);
    }

    #[
        test(
            sender = @sshift_dao_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_resource_account_with_not_reviewer_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        remove_resource_account(user2, user4);
    }
}
