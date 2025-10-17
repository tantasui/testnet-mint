// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module testnet_nft::testnet_nft;

use std::string;
use sui::event;
use sui::url::{Self, Url};
use sui::package;
use sui::display;

/// An example NFT that can be minted by anybody
public struct TestnetNFT has key, store {
    id: UID,
    /// Name for the token
    name: string::String,
    /// Description of the token
    description: string::String,
    /// URL for the token
    url: Url,
    // TODO: allow custom attributes
}

// ===== Events =====

public struct NFTMinted has copy, drop {
    // The Object ID of the NFT
    object_id: ID,
    // The creator of the NFT
    creator: address,
    // The name of the NFT
    name: string::String,
}

// ===== Public view functions =====

/// Get the NFT's `name`
public fun name(nft: &TestnetNFT): &string::String {
    &nft.name
}

/// Get the NFT's `description`
public fun description(nft: &TestnetNFT): &string::String {
    &nft.description
}

/// Get the NFT's `url`
public fun url(nft: &TestnetNFT): &Url {
    &nft.url
}

// ===== Entrypoints =====

#[allow(lint(self_transfer))]
/// Create a new devnet_nft
public fun mint_to_sender(
    name: vector<u8>,
    description: vector<u8>,
    url: vector<u8>,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let nft = TestnetNFT {
        id: object::new(ctx),
        name: string::utf8(name),
        description: string::utf8(description),
        url: url::new_unsafe_from_bytes(url),
    };

    event::emit(NFTMinted {
        object_id: object::id(&nft),
        creator: sender,
        name: nft.name,
    });

    transfer::public_transfer(nft, sender);
}

/// Transfer `nft` to `recipient`
public fun transfer(nft: TestnetNFT, recipient: address, _: &mut TxContext) {
    transfer::public_transfer(nft, recipient)
}

/// Update the `description` of `nft` to `new_description`
public fun update_description(
    nft: &mut TestnetNFT,
    new_description: vector<u8>,
    _: &mut TxContext,
) {
    nft.description = string::utf8(new_description)
}

/// Permanently delete `nft`
public fun burn(nft: TestnetNFT, _: &mut TxContext) {
    let TestnetNFT { id, name: _, description: _, url: _ } = nft;
    id.delete()
}

public struct TESTNET_NFT has drop {}

fun init(otw: TESTNET_NFT, ctx: &mut TxContext) {
    let keys = vector[
        b"name".to_string(),
        b"link".to_string(),
        b"image_url".to_string(),
        b"description".to_string(),
        b"project_url".to_string(),
        b"creator".to_string(),
    ];

    let values = vector[
        b"{name}".to_string(),
        b"`https://example.com/nft/{id}`".to_string(),
        // Use the on-chain Url field for image previews
        b"{url}".to_string(),
        b"A testnet NFT from the sample module.".to_string(),
        b"`https://example.com`".to_string(),
        b"Unknown".to_string(),
    ];

    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<TestnetNFT>(&publisher, keys, values, ctx);

    display.update_version();

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}