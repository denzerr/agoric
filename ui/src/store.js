// The code in this file requires an understanding of Autodux.
// See: https://github.com/ericelliott/autodux
import autodux from 'autodux';

export const {
  reducer,
  initial: defaultState,
  actions: {
    setApproved,
    setConnected,
    setPurses,
    setIssuers,
    setBrands,
    setCollaterals,
    setInputPurse,
    setOutputPurse,
    setInputAmount,
    setOutputAmount,
    setInputChanged,
    setOutputChanged,
    swapInputs,
    resetAMM,
    resetState,
    setTreasury,
    setVaultCollateral,
    setVaultConfiguration,
    setVaultCreated,
    createVault,
    updateVault,
    resetVault,
  },
} = autodux({
  slice: 'treasury',
  initial: {
    approved: true,
    connected: false,
    account: null,
    purses: null,
    brands: null,
    issuers: null,
    // Autoswap state
    inputPurse: null,
    outputPurse: null,
    inputAmount: null,
    outputAmount: null,
    inputChanged: false,
    outputChanged: false,
    // Vault state
    treasury: null,
    vaultCollateral: null,
    vaultConfiguration: null,
    vaultCreated: false,
    vaults: {},
    collaterals: null,
  },
  actions: {
    createVault: (state, { id, vault }) => {
      return {
        ...state,
        vaults: {
          ...state.vaults,
          [id]: vault,
        },
      };
    },
    updateVault: ({ vaults, ...state }, { id, vault }) => {
      const oldVaultData = vaults[id];
      const status = vault.liquidated ? 'Liquidated' : 'Loan Initiated';
      return {
        ...state,
        vaults: { ...vaults, [id]: { ...oldVaultData, ...vault, status } },
      };
    },
    resetVault: state => ({
      ...state,
      vaultCollateral: null,
      vaultConfiguration: null,
    }),
    swapInputs(state) {
      const { inputPurse, outputPurse, inputAmount, outputAmount } = state;
      return {
        ...state,
        inputPurse: outputPurse,
        outputPurse: inputPurse,
        inputAmount: outputAmount,
        outputAmount: inputAmount,
      };
    },
    resetAMM: state => ({
      ...state,
      inputPurse: null,
      outputPurse: null,
      inputAmount: null,
      outputAmount: null,
    }),
    resetState: state => ({
      ...state,
      purses: null,
      collaterals: null,
      inputPurse: null,
      outputPurse: null,
      inputAmount: null,
      outputAmount: null,
    }),
  },
});
