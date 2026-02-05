use anchor_lang::prelude::*;

declare_id!("2vganB6PWb5jPef8ocKtjJWrSTWQuW1ZsP9RTadndfDz");

#[program]
pub mod anchorage_bridge {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;
        vault.owner = *ctx.accounts.authority.key;
        vault.collateral_amount = 0;

        msg!("Vault initialization complete:");
        Ok(())
    }

    pub fn toggle_freeze(ctx: Context<ToggleFreeze>, frozen: bool) -> Result<()> {
        let state = &mut ctx.accounts.global_state;
        state.is_frozen = frozen;
        msg!("Bridge Freeze Status: {}", frozen);
        Ok(())
    }   

    pub fn transfer_hook(ctx: Context<TransferHook>, _amount: u64) -> Result<()>{
        let global_state = &ctx.accounts.global_state;

        if global_state.is_frozen {
            msg!("TRANSFER REJECTED: Bridge is in Emergency Freeze mode.");
            return Err(error!(ErrorCode::BridgeIsFrozen));
        }

        msg!("Transfer approved by Anchorage Bridge.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    // This is the PDA logic. 
    // 'seeds' are like the ingredients for the address.
    // 'bump' is a security feature to ensure the address is valid.
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 8, // 8 (ID) + 32 (Pubkey) + 8 (u64 amount)
        seeds = [b"vault", authority.key().as_ref()], 
        bump
    )]
    pub vault_account: Account<'info, VaultState>,
    
    #[account(mut)]
    pub authority: Signer<'info>, // The person paying for the account
    pub system_program: Program<'info, System>, // Required for creating accounts
}

#[derive(Accounts)]
pub struct ToggleFreeze<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 1, // Discriminator + Boolean
        seeds = [b"global-state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_amount: u64)]
pub struct TransferHook<'info> {
    #[account(seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,
    
    /// CHECK: This is the token account sending the assets. It is validated by the Token-2022 program.
    pub source_token: UncheckedAccount<'info>,
    
    /// CHECK: This is the Mint of the token. We check this if we want to restrict the hook to specific assets.
    pub mint: UncheckedAccount<'info>,
    
    /// CHECK: This is the token account receiving the assets. Validated by Token-2022.
    pub destination_token: UncheckedAccount<'info>,
    
    /// CHECK: This is the owner of the source token account.
    pub owner: UncheckedAccount<'info>,
    
    /// CHECK: This is the extra metas account that stores the instruction configuration.
    pub extra_metas: UncheckedAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub is_frozen: bool, // true = stopped, false = active
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub owner: Pubkey,           // 32 bytes
    pub collateral_amount: u64,  // 8 bytes
}

#[error_code]
pub enum ErrorCode {
    #[msg("The bridge is currently frozen by the bank.")]
    BridgeIsFrozen,
}
