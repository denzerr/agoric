/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';

import { AmountMath } from '@agoric/ertp';
import { E } from '@agoric/eventual-send';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';
import { Grid, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { makeNatAmountInput, filterPurses } from '@agoric/ui-components';

import ApproveOfferSB from '../ApproveOfferSB';
import ConfirmOfferTable from './ConfirmOfferTable';
import GetStarted from './GetStarted';
import NatPurseAmountInput from './NatPurseAmountInput';
import { getPurseDecimalPlaces } from '../helpers';

const NatAmountInput = makeNatAmountInput({ React, TextField });

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing(4),
    borderRadius: '20px',
    color: '#707070',
    fontSize: '22px',
    lineHeight: '27px',
    padding: theme.spacing(4),
    paddingTop: theme.spacing(2),
  },
  settingsToolbar: {
    minHeight: '48px',
    paddingLeft: '20px',
  },
  toolbarIcon: {
    marginRight: theme.spacing(1),
  },
  buttons: {
    marginTop: theme.spacing(1),
  },
  actionChoices: {
    marginBottom: theme.spacing(3),
    maxHeight: '40px',
  },
  button: {
    color: 'white',
  },
  infoText: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
  title: {
    fontSize: '22px',
  },
  tabsRoot: {
    flexGrow: 1,
  },
  break: {
    border: 0,
    height: '1px',
    background: '#E5E5E5',
  },
  step: {
    marginBottom: theme.spacing(3),
  },
  stepTitle: {
    fontSize: '18px',
    color: '#707070',
    marginBottom: theme.spacing(2),
  },
  adjustCollateral: {
    paddingBottom: theme.spacing(3),
  },
  adjustDebt: {
    paddingBottom: theme.spacing(3),
  },
  checkboxLabel: {
    fontSize: '16px',
    color: '#222222',
  },
  form: {
    marginTop: theme.spacing(4),
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  confirm: {
    marginTop: theme.spacing(4),
  },
}));

const Adjust = ({
  purses,
  brandToInfo,
  brand,
  debtBrand,
  collateralization,
  runPercent,
  marketPrice,
  accountState,
  walletP,
  lienBrand,
  getRun,
  loan,
}) => {
  const classes = useStyles();

  const [runPurseSelected, setRunPurseSelected] = useState(null);
  const [collateralAction, setCollateralAction] = useState('lock');
  const [debtAction, setDebtAction] = useState('borrow');
  const [debtDelta, setDebtDelta] = useState(null);
  const [lockedDelta, setLockedDelta] = useState(null);
  const [getStartedClicked, setGetStartedClicked] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [openApproveOfferSB, setOpenApproveOfferSB] = useState(false);

  const handleTabChange = (_, newTab) => {
    setCurrentTab(newTab);
  };

  const handleApproveOfferSBClose = () => {
    setOpenApproveOfferSB(false);
  };

  useEffect(() => {
    setDebtDelta(null);
    setLockedDelta(null);
    if (currentTab === 0) {
      setCollateralAction('lock');
      setDebtAction('borrow');
    } else {
      setCollateralAction('unlock');
      setDebtAction('repay');
    }
  }, [currentTab]);

  if (!purses || !brand || !debtBrand || !accountState || !loan) {
    return (
      <div>
        <Paper elevation={3} className={classes.root}>
          <GetStarted />
        </Paper>
      </div>
    );
  }

  const isLoanInProgress = ['proposed', 'pending', 'complete'].includes(
    loan?.status,
  );

  const isLoanOpen = loan?.status === 'accept';

  if ((!isLoanOpen && !getStartedClicked) || isLoanInProgress) {
    return (
      <Paper elevation={3} className={classes.root}>
        <GetStarted
          pendingApproval={isLoanInProgress}
          onGetStarted={() => setGetStartedClicked(true)}
        />
      </Paper>
    );
  }

  const runPurses = filterPurses(purses, debtBrand);
  const runPurse =
    runPurseSelected || runPurses.length > 0 ? runPurses[0] : null;

  const bldPurses = filterPurses(purses, brand);
  // TODO: find a better way to identify the staking purse.
  const bldStakingPurse = bldPurses.length > 0 ? bldPurses[0] : null;

  const handleCollateralAmountChange = value => {
    const newLockedDelta = AmountMath.make(brand, value);
    setLockedDelta(newLockedDelta);
  };

  const handleDebtAmountChange = value => {
    const newDebtDelta = AmountMath.make(debtBrand, value);
    setDebtDelta(newDebtDelta);
  };

  const adjustCollateral = (
    <Grid item className={classes.step}>
      <Typography variant="h6" className={classes.stepTitle}>
        {collateralAction === 'lock' ? 'Lien BLD' : 'Unlien BLD'}
      </Typography>
      <div className={classes.collateralForm}>
        <NatAmountInput
          label="Amount"
          onChange={handleCollateralAmountChange}
          value={lockedDelta && lockedDelta.value}
          decimalPlaces={getPurseDecimalPlaces(bldStakingPurse)}
          placesToShow={2}
        />
      </div>
    </Grid>
  );

  const adjustDebt = (
    <Grid item className={classes.step}>
      <Typography variant="h6" className={classes.stepTitle}>
        {debtAction === 'borrow' ? 'Borrow RUN' : 'Repay RUN'}
      </Typography>
      <NatPurseAmountInput
        purses={runPurses}
        selectedPurse={runPurse}
        amount={debtDelta && debtDelta.value}
        onPurseChange={setRunPurseSelected}
        onAmountChange={handleDebtAmountChange}
        brandToFilter={debtBrand}
        brandToInfo={brandToInfo}
        iconSrc="tokens/RUN.svg"
      />
    </Grid>
  );

  const openLoan = () => {
    const id = `${Date.now()}`;
    setDebtDelta(null);
    setLockedDelta(null);
    setOpenApproveOfferSB(true);

    const invitation = E(getRun.getRunApi).makeLoanInvitation();
    const collateralAmount = AmountMath.make(
      lienBrand,
      lockedDelta?.value ?? 0n,
    );
    const debtAmount = AmountMath.make(debtBrand, debtDelta?.value ?? 0n);

    const offerConfig = {
      id,
      invitation,
      installationHandleBoardId: getRun.installationBoardId,
      instanceHandleBoardId: getRun.instanceBoardId,
      proposalTemplate: {
        give: {
          Attestation: {
            value: collateralAmount.value,
            pursePetname: bldStakingPurse.pursePetname,
            type: 'Attestation',
          },
        },
        want: {
          RUN: {
            pursePetname: runPurseSelected.pursePetname,
            value: debtAmount.value,
          },
        },
      },
    };

    console.log('OFFER CONFIG', offerConfig);

    E(walletP).addOffer(offerConfig);
  };

  const makeOffer = async () => {
    if (!isLoanOpen) {
      openLoan();
      return;
    }

    const id = `${Date.now()}`;
    setDebtDelta(null);
    setLockedDelta(null);
    setOpenApproveOfferSB(true);

    const continuingInvitation = {
      priorOfferId: loan?.id,
      description: 'AdjustBalances',
    };

    const collateralAmount = AmountMath.make(
      lienBrand,
      lockedDelta?.value ?? 0n,
    );
    const debtAmount = AmountMath.make(debtBrand, debtDelta?.value ?? 0n);

    const RUN = {
      value: debtAmount.value,
      pursePetname: runPurseSelected.pursePetname,
    };

    const give = {};
    const want = {};

    const Attestation = {
      value: collateralAmount.value,
      pursePetname: bldStakingPurse.pursePetname,
      type: 'Attestation',
    };

    if (collateralAction === 'lock' && collateralAmount.value > 0n) {
      give.Attestation = Attestation;
    } else if (collateralAmount.value > 0n) {
      want.Attestation = Attestation;
    }

    if (debtAction === 'borrow' && debtAmount.value > 0n) {
      want.RUN = RUN;
    } else if (debtAmount.value > 0n) {
      give.RUN = RUN;
    }

    const offerConfig = {
      id,
      continuingInvitation,
      installationHandleBoardId: getRun.installationBoardId,
      instanceHandleBoardId: getRun.instanceBoardId,
      proposalTemplate: {
        give,
        want,
      },
    };

    console.log('OFFER CONFIG', offerConfig);

    E(walletP).addOffer(offerConfig);
  };

  return (
    <>
      <Paper elevation={3} className={classes.root}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Borrow" />
          <Tab label="Repay" />
        </Tabs>
        <Grid className={classes.form} container direction="column">
          {adjustCollateral}
          {adjustDebt}
        </Grid>
        <div className={classes.confirm}>
          <hr className={classes.break} />
          <Grid
            container
            spacing={1}
            className={classes.buttons}
            justify="space-evenly"
            alignItems="center"
          >
            <Grid item>
              <ConfirmOfferTable
                locked={accountState.liened}
                borrowed={loan?.data?.debt ?? AmountMath.makeEmpty(debtBrand)}
                lockedDelta={lockedDelta}
                debtDelta={debtDelta}
                brandToInfo={brandToInfo}
                collateralization={collateralization}
                collateralAction={collateralAction}
                debtAction={debtAction}
                runPercent={runPercent}
                marketPrice={marketPrice}
              />
            </Grid>
            <Grid item>
              <Button
                onClick={() => makeOffer()}
                className={classes.button}
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
              >
                Make Offer
              </Button>
            </Grid>
          </Grid>
        </div>
      </Paper>
      <ApproveOfferSB
        open={openApproveOfferSB}
        handleClose={handleApproveOfferSBClose}
      />
    </>
  );
};

export default Adjust;
