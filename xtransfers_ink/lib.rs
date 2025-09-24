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
    pub struct XTransfers {}

    impl XTransfers {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                system_chains: [
                    1000, // Asset Hub
                    1002, // Bridge Hub
                    1004, // People Chain
                    1005, // Coretime Chain
                ],
            }
        }

        #[ink(message)]
        pub fn transfer(&self, para_id: u32, beneficiary: Bytes32, amount: u128) -> Bytes {
            if para_id < 2000 {
                self.teleport(para_id, beneficiary, amount)
            } else {
                self.reserve_backed_transfer(para_id, beneficiary, amount)
            }
        }

        fn reserve_backed_transfer(
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

        fn teleport(&self, para_id: u32, beneficiary: Bytes32, amount: u128) -> Bytes {
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
