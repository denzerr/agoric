import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import { makeDisplayFunctions } from '../helpers';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing(2),
    borderRadius: '20px',
    color: '#707070',
    fontSize: '22px',
    lineHeight: '27px',
    padding: theme.spacing(4),
    minWidth: '50vw',
  },
  title: {
    fontSize: '22px',
  },
  table: {
    minWidth: 650,
    '& > .MuiTableCell-root': {
      borderBottom: 'none',
    },
  },
  row: {
    '& > th, td': {
      borderBottom: 'none',
    },
    '& > th': {
      paddingLeft: 0,
    },
    '& > td': {
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
  break: {
    border: 0,
    height: '1px',
    background: '#E5E5E5',
  },
  empty: {
    fontSize: '18px',
    lineHeight: '24px',
    color: '#707070',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
}));

const createData = (date, locked, borrowed, id) => ({
  date,
  locked,
  borrowed,
  id,
});

const formatDateNow = stamp => {
  if (!stamp) {
    return 'unknown time';
  }
  const date = new Date(stamp);
  const isoStamp = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  const isoDate = new Date(isoStamp);
  const isoStr = isoDate.toISOString();
  const match = isoStr.match(/^(.*)T(.*)\..*/);
  return `${match[1]} ${match[2]}`;
};

const History = ({ history, brandToInfo }) => {
  const { displayRatio } = makeDisplayFunctions(brandToInfo);
  const classes = useStyles();

  const rows =
    history &&
    brandToInfo &&
    history
      .map(item =>
        createData(
          item.date,
          `${
            (item.locked?.numerator?.value ?? 0) > 0 &&
            item.lockedAction === 'unlock'
              ? '-'
              : ''
          }${displayRatio(item.locked)}`,
          `${
            (item.debt?.numerator?.value ?? 0) > 0 &&
            item.debtAction === 'repay'
              ? '-'
              : ''
          }${displayRatio(item.debt)}`,
          item.id,
        ),
      )
      ?.sort((a, b) => b.date - a.date);

  const content = history?.length ? (
    <TableContainer>
      <Table className={classes.table} size="small">
        <TableHead>
          <TableRow className={[classes.rowHeader, classes.row].join(' ')}>
            <TableCell>Date</TableCell>
            <TableCell align="right">Locked</TableCell>
            <TableCell align="right">Borrowed</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} className={classes.row}>
              <TableCell className={classes.left}>
                {formatDateNow(row.date)}
              </TableCell>
              <TableCell align="right">{row.locked} BLD</TableCell>
              <TableCell align="right">{row.borrowed} RUN</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <div className={classes.empty}>Transactions will appear here.</div>
  );

  return (
    <Paper className={classes.root} elevation={4}>
      <Typography className={classes.title}>History</Typography>
      <hr className={classes.break} />
      {content}
    </Paper>
  );
};
export default History;