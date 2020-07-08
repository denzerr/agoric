/* global harden */

import { assert, details, q } from '@agoric/assert';
import { E } from '@agoric/eventual-send';
import { makeZoeHelpers } from '@agoric/zoe/src/contractSupport';
import { burn } from './burn';
import { makeEmptyOfferWithResult } from './make-empty';

// a Vault is an individual loan, using some collateralType as the
// collateral, and lending Scones to the borrower

export function makeVault(zcf, collateralHolderOffer, sconeDebt, sconeStuff, autoswap) {
  // 'collateralHolderOffer' is the Offer that currently holds the borrower's
  // collateral (zoe owns the tokens for the benefit of this Offer)
  const { mint: sconeMint, issuer: sconeIssuer, amountMath: sconeMath } = sconeStuff;
  const { trade, checkHook, escrowAndAllocateTo } = makeZoeHelpers(zcf);
  const zoe = zcf.getZoeService();

  function addCollateralHook(offerHandle) {
    const {
      proposal: {
        give: { Collateral: collateralAmount },
      },
    } = zcf.getOffer(offerHandle);
    console.log(`-- h2`);

    trade(
      {
        offerHandle: collateralHolderOffer,
        gains: { Collateral: collateralAmount },
      },
      { offerHandle, gains: {} },
    );
    zcf.complete(offerHandle);
    return 'a warm fuzzy feeling that you are further away from default than ever before';
  }

  function makeAddCollateralInvite() {
    const expected = harden({
      give: { Collateral: null },
      want: { Scones: null },
    });
    return zcf.makeInvitation(checkHook(addCollateralHook, expected), 'add collateral');
  }

  /*
  // this version can only pay back the whole loan
  async function paybackHook(offerHandle) {
    const {
      proposal: {
        give: { Scones: sconesReturned },
        want: { Collateral: collateralAmount }, // user should pre-measure the remaining collateral
      },
    } = zcf.getOffer(offerHandle);

    const { Collateral: haveCollateral } = zcf.getCurrentAllocation(o);

    assert(sconeMath.isGTE(sconesReturned, sconeDebt));

    trade(
      {
        offerHandle: collateralHolderOffer,
        gains: { Scones: sconeDebt }, // return any overpayment
      },
      { offerHandle,
        gains: { Collateral: haveCollateral },
      },
    );
    sconeDebt = sconeMath.getEmpty();
    // burn the scones. first we need zoe to make us a payment
    await burn(trade, collateralHolderOffer, { Scones: sconeIssuer }, { Scones: sconeDebt });
    // AWAIT

    zcf.complete(offerHandle);

    return 'thank you for your business';
  }
  */

  async function paybackHook(offerHandle) {
    const {
      proposal: {
        give: { Scones: sconesReturned },
        want: { Collateral: collateralWanted },
      },
    } = zcf.getOffer(offerHandle);

    const stalePrice = await E(autoswap).getCurrentPrice();
    // AWAIT

    // you might offer too much: we won't take more than you owe
    const acceptedScones = sconeMath.make(Math.min(sconesReturned.extent,
                                                   sconeDebt.extent));
    // if we accept your scones, this is how much you'd still owe
    const remainingDebt = sconeMath.subtract(sconeDebt, acceptedScones);
    const { Collateral: currentCollateral } = zcf.getCurrentAllocation(o);

    const collateralMath = zcf.getAmountMath(currentCollateral.brand);
    // and you'd have this much collateral left:
    const remainingCollateral = collateralMath.subtract(currentCollateral, collateralWanted);

    // that will require at least this much collateral:
    const margin = 1.5;
    const maxScones = sconeMath.make(stalePrice.extent * remainingCollateral.extent / margin);
    assert(sconeMath.isGTE(maxScones, remainingDebt), 'insufficient remaining collateral');

    trade(
      {
        offerHandle: collateralHolderOffer,
        gains: { Scones: acceptedScones }, // return any overpayment
      },
      { offerHandle,
        gains: { Collateral: collateralWanted },
      },
    );
    sconeDebt = sconeMath.subtract(sconeDebt, acceptedScones);
    zcf.complete(offerHandle);

    // todo: have a separate offer just for burning, don't use
    // 'collateralHolderOffero'. burn offers are short-lived,
    // 'collateralHolderOffer' is long-lived

    // burn the scones. first we need zoe to make us a payment
    await burn(trade, collateralHolderOffer, { Scones: sconeIssuer }, { Scones: acceptedScones });
    // AWAIT

    // note: the only way to delete the Vault completely is close()
    return 'thank you for your payment';
  }

  function makePaybackInvite() {
    const expected = harden({
      give: { Scones: null },
      want: { Collateral: null },
    });
    return zcf.makeInvitation(checkHook(paybackHook, expected), 'pay back partially');
  }


  async function closeHook(offerHandle) {
    const {
      proposal: {
        give: { Scones: sconesReturned },
        want: { Collateral: collateralWanted },
      },
    } = zcf.getOffer(offerHandle);

    // you're paying off the debt, you get everything back. If you were
    // underwater, we should have liquidated some collateral earlier: we
    // missed our chance.

    // you must pay off the entire remainder
    assert(sconeMath.isGTE(sconeDebt, sconesReturned));
    // but if you offer too much, we won't take more than you owe
    const acceptedScones = sconeMath.make(Math.min(sconesReturned.extent,
                                                   sconeDebt.extent));

    const { Collateral: currentCollateral } = zcf.getCurrentAllocation(collateralHolderOffer);

    trade(
      {
        offerHandle: collateralHolderOffer,
        gains: { Scones: acceptedScones }, // return any overpayment
      },
      { offerHandle,
        gains: { Collateral: currentCollateral },
      },
    );
    sconeDebt = sconeMath.getEmpty();
    zcf.complete(offerHandle);

    // burn the scones. first we need zoe to make us a payment
    await burn(trade, collateralHolderOffer, { Scones: sconeIssuer }, { Scones: acceptedScones });
    // AWAIT

    // todo: close the vault
    // zcf.complete(collateralHolderOffer)

    return 'your loan is closed, thank you for your business';
  }

  function makeCloseInvite() {
    const expected = harden({
      give: { Scones: null },
      want: { Collateral: null },
    });
    return zcf.makeInvitation(checkHook(paybackHook, expected), 'pay off entire loan and close Vault');
  }

  async function liquidate() {
    // First, take all the collateral away from collateralHolderOffer, so we
    // can sell it
    const { Collateral: currentCollateral } = zcf.getCurrentAllocation(collateralHolderOffer);

    const offer2 = await makeEmptyOfferWithResult();
    trade(
      {
        offerHandle: collateralHolderOffer,
        gains: { },
      },
      {
        offerHandle: offer2.offerHandle,
        gains: { Collateral:  currentCollateral },
      },
    );
    const payout2 = await offer2.payout;

    // Then, sell off all their collateral. We really only need enough to
    // cover 'sconeDebt', but our autoswap API doesn't give us a way to
    // specify just the output amount yet.
    const swapInvite = E(autoswap).makeSwapInvite(); // really inviteP, that's ok
    const saleOffer = harden({
      give: { Collateral: currentCollateral },
      want: { Scones: sconeMath.empty() }, // we'll take anything we can get
    });
    const { payout: salesPayoutP } = await E(zoe).offer(swapInvite, saleOffer, payout2);
    const { Scones: sconeProceeds, ...otherProceeds } = await salesPayoutP;
    // we now claim enough from sconeProceeds to cover the debt (if there's
    // enough). They get back the rest, as well as any remaining scones.

    const isUnderwater = !sconeMath.isGTE(sconeProceeds, sconeDebt);
    const underwaterBy = isUnderwater ? sconeMath.subtract(sconeDebt, sconeProceeds) : sconeMath.empty();
    const sconesToBurn = isUnderwater ? sconeProceeds : sconeDebt;
    const [sconePaymentToBurn, sconePaymentToRefund] = await E(sconeIssuer).split(sconeProceeds, sconesToBurn);

    // refund any remaining scones, plus anything else leftover from the sale
    // (perhaps some collateral, who knows maybe autoswap threw in a free
    // toaster)
    const refund = { Scones: sconePaymentToRefund, ...otherProceeds };
    for (const keyword of refund.keys()) {
      const payment = refund[keyword];
      const allegedBrand = await E(payment).getAllegedBrand();
      const issuer = zcf.getIssuerForBrand(allegedBrand); // TODO: requires a zoe addition
      const amount = await E(issuer).getAmountOf(payment);
      await escrowAndAllocateTo({
        amount,
        payment: refund[keyword],
        keyword,
        recipientHandle: collateralHolderOffer,
p      });
    }

    if (isUnderwater) {
      console.log(`underwater by`, underwaterBy);
      // todo: fall back to next recovery layer
      // moreSconesToBurn = getSconesFromFallbackLayers(underwaterBy);
    }

    // finally burn
    await E(sconeIssuer).burn(sconesToBurn);
    // await E(sconeIssuer).burn(moreSconesToBurn);

  }


  // Call this each time the price changes, and after some other operations.
  // If the collateral no longer has sufficient value to meet the margin
  // requirement, this will sell off all the collateral, deduct the scones
  // they still owe, and return the remaining scones.
  async function checkMargin() {
    let liquidate = false;
    // get current price

    // compute how much debt is supported by the current collateral at that price

    // compute how much is unsupported

    // compute how much collateral must be forefeit to buy that much Scone

    if (liquidate) {
      liquidate();
    }
    // 
  }

  const vault = harden({
    makeAddCollateralInvite,
    makePaybackInvite,
    makeCloseInvite,
  });

  return vault;
}



  // payback could be split into:
  // * returnScones: reduces sconeDebt
  // * withdrawSomeCollateral: do margin check, remove collateral
  // * close: do margin check, remove all collateral, close Vault
  //
  // the downside is that a buggy vault contract could accept returnScones()
  // but break before withdrawSomeCollateral() finishes

  // consider payback() and close()
