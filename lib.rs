#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod xtransfers {
    use ink::{
        prelude::vec,
        xcm::{latest::AssetTransferFilter, prelude::*},
    };
    use parity_scale_codec::Encode;

    type Bytes = ink::sol::DynBytes;
    type Bytes32 = ink::sol::FixedBytes<32>;

    #[ink(storage)]
    pub struct XTransfers {
        system_chains: ink::storage::Mapping<u32, ()>,
    }

    impl XTransfers {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut system_chains = ink::storage::Mapping::new();

            system_chains.insert(1000, &()); // Asset Hub
            system_chains.insert(1002, &()); // Bridge Hub
            system_chains.insert(1004, &()); // People Chain
            system_chains.insert(1005, &()); // Coretime Chain

            Self { system_chains }
        }

        #[ink(message)]
        pub fn is_system_chain(&self, chain_id: u32) -> bool {
            self.system_chains.contains(chain_id)
        }

        #[ink(message)]
        pub fn transfer(&self, para_id: u32, beneficiary: Bytes32, amount: u128) -> Bytes {
            if self.is_system_chain(para_id) {
                self.teleport(para_id, beneficiary, amount)
            } else {
                self.reserve_based_transfer(para_id, beneficiary, amount)
            }
        }

        #[ink(message)]
        pub fn reserve_based_transfer(
            &self,
            para_id: u32,
            beneficiary: Bytes32,
            amount: u128,
        ) -> Bytes {
            let destination = Location::new(1, [Parachain(para_id)]);
            let remote_fees = AssetTransferFilter::ReserveDeposit(Definite(
                (Parent, amount.saturating_div(10)).into(),
            ));
            let preserve_origin = false;
            let transfer_assets = vec![AssetTransferFilter::ReserveDeposit(Wild(AllCounted(1)))];
            let remote_xcm = Xcm::<()>::builder_unsafe()
                .deposit_asset(AllCounted(1), *beneficiary)
                .build();

            let xcm = Xcm::<()>::builder()
                .withdraw_asset((Parent, amount))
                .pay_fees((Parent, amount.saturating_div(10)))
                .initiate_transfer(
                    destination,
                    remote_fees,
                    preserve_origin,
                    transfer_assets,
                    remote_xcm,
                )
                .build();

            let versioned = VersionedXcm::from(xcm);
            ink::sol::DynBytes(versioned.encode())
        }

        #[ink(message)]
        pub fn teleport(&self, para_id: u32, beneficiary: Bytes32, amount: u128) -> Bytes {
            let destination = Location::new(1, [Parachain(para_id)]);
            let remote_fees =
                AssetTransferFilter::Teleport(Definite((Parent, amount.saturating_div(10)).into()));
            let preserve_origin = false;
            let transfer_assets = vec![AssetTransferFilter::Teleport(Wild(AllCounted(1)))];
            let remote_xcm = Xcm::<()>::builder_unsafe()
                .deposit_asset(AllCounted(1), *beneficiary)
                .build();

            let xcm = Xcm::<()>::builder()
                .withdraw_asset((Parent, amount))
                .pay_fees((Parent, amount.saturating_div(10)))
                .initiate_transfer(
                    destination,
                    remote_fees,
                    preserve_origin,
                    transfer_assets,
                    remote_xcm,
                )
                .build();

            let versioned = VersionedXcm::from(xcm);
            ink::sol::DynBytes(versioned.encode())
        }
    }
}
