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

#[account]
pub struct VaultState {
    pub owner: Pubkey,           // 32 bytes
    pub collateral_amount: u64,  // 8 bytes
}
