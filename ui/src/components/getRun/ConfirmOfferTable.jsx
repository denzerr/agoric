import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { makeRatio } from '@agoric/zoe/src/contractSupport';
import { makeDisplayFunctions } from '../helpers';

const useStyles = makeStyles(_ => ({
  table: {
    '& > .MuiTableCell-root': {
      borderBottom: 'none',
    },
  },
  tableContainer: {
    width: 'fit-content',
  },
  row: {
    '& > th, td': {
      borderBottom: 'none',
    },
    '& > th': {
      paddingLeft: 0,
    },
    '& > td': {
      paddingLeft: 0,
      fontSize: '18px',
      lineHeight: '24px',
      color: '#707070',
    },
  },
  left: {
    paddingLeft: 0,
  },
  rowHeader: {
    '& > *': {
      fontSize: '16px',
    },
  },
  new: {
    color: 'rgba(0, 0, 0, 0.87)',
  },
}));

const ConfirmOfferTable = ({
  locked,
  borrowed,
  lockedDelta,
  debtDelta,
  collateralAction,
  runPercent,
  debtAction,
  brandToInfo,
  collateralization,
  marketPrice,
}) => {
  const { displayRatio, displayPercent } = makeDisplayFunctions(brandToInfo);
  const classes = useStyles();

  let newLockedValue =
    collateralAction === 'lock'
      ? locked.numerator.value + (lockedDelta?.value ?? 0n) / 10n ** 4n
      : locked.numerator.value - (lockedDelta?.value ?? 0n) / 10n ** 4n;
  let newLockedSignum = '';
  if (newLockedValue < 0) {
    newLockedSignum = '-';
    newLockedValue *= -1n;
  }

  let newBorrowedValue =
    debtAction === 'borrow'
      ? borrowed.numerator.value + (debtDelta?.value ?? 0n) / 10n ** 4n
      : borrowed.numerator.value - (debtDelta?.value ?? 0n) / 10n ** 4n;
  let newBorrowedSignum = '';
  if (newBorrowedValue < 0) {
    newBorrowedSignum = '-';
    newBorrowedValue *= -1n;
  }

  const newLocked = makeRatio(newLockedValue, locked.numerator.brand);

  const newBorrowed = makeRatio(newBorrowedValue, borrowed.numerator.brand);

  const newRunPercent =
    newLocked &&
    newBorrowed &&
    newBorrowed.numerator.value > 0n &&
    !(newLockedSignum || newBorrowedSignum) &&
    makeRatio(
      newBorrowed.numerator.value,
      newBorrowed.numerator.brand,
      (newLocked.numerator.value * marketPrice.numerator.value) /
        marketPrice.denominator.value,
      newLocked.numerator.brand,
    );

  return (
    <TableContainer className={classes.tableContainer}>
      <Table className={classes.table} size="small">
        <TableHead>
          <TableRow className={[classes.rowHeader, classes.row].join(' ')}>
            <TableCell>Locked</TableCell>
            <TableCell>Debt</TableCell>
            <TableCell>RUN Percent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow className={classes.row}>
            <TableCell>
              {displayRatio(locked)} -&gt;{' '}
              <span
                className={
                  displayRatio(newLocked) !== displayRatio(locked) &&
                  classes.new
                }
              >
                {newLockedSignum}
                {displayRatio(newLocked)} BLD
              </span>
            </TableCell>
            <TableCell>
              {displayRatio(borrowed)} -&gt;{' '}
              <span
                className={
                  displayRatio(newBorrowed) !== displayRatio(borrowed) &&
                  classes.new
                }
              >
                {newBorrowedSignum}
                {displayRatio(newBorrowed)} RUN
              </span>
            </TableCell>
            <TableCell>
              {runPercent ? displayPercent(runPercent) : '-'}% -&gt;{' '}
              <span
                className={
                  (collateralization
                    ? displayPercent(collateralization)
                    : '-') !==
                    (newRunPercent ? displayPercent(newRunPercent) : '-') &&
                  classes.new
                }
              >
                {newRunPercent ? displayPercent(newRunPercent) : '-'}%
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConfirmOfferTable;