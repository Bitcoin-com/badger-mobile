// @flow

import React from "react";
import styled, { css } from "styled-components";
import { View, Image, StyleSheet } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import moment from "moment";

import SLPSDK from "slp-sdk";

import { T } from "../../atoms";

const SLP = new SLPSDK();

const Row = styled(View)`
  padding: 16px;
  margin-bottom: 8px;
  /* border-bottom-color: ${props => props.theme.bg900};
  border-bottom-width: 3px; */

  background-color: ${props =>
    ({
      send: props.theme.accent900,
      receive: props.theme.primary900,
      interwallet: props.theme.fg800
    }[props.type] || props.theme.fg800)}
  /* ${props =>
    props.type === "send"
      ? css`
          background-color: ${props => props.theme.accent900};
        `
      : css`
          background-color: ${props => props.theme.primary900};
        `} */
`;

const DateRow = styled(View)`
  margin-bottom: 4px;
`;
const MetaRow = styled(View)`
  margin-top: 4px;
`;
const AmountRow = styled(View)`
  flex-direction: row;
`;

const IconArea = styled(View)`
  justify-content: center;
  margin-right: 10px;
`;

const IconImage = styled(Image)`
  width: 36;
  height: 36;
  border-radius: 18;
  overflow: hidden;
`;

const InfoArea = styled(View)`
  flex: 1;
  justify-content: center;
`;
const AmountArea = styled(View)`
  justify-content: center;
`;

let blockieCache = {};

type Props = {
  type: "send" | "receive",
  txId: string,
  timestamp: number,
  toAddress: string,
  toAddresses: string[],
  fromAddresses: string[],
  fromAddress: ?string,
  symbol: string,
  tokenId: string,
  amount: string
};

const TransactionRow = ({
  type,
  txId,
  timestamp,
  toAddresses,
  toAddress,
  fromAddresses,
  fromAddress,
  symbol,
  tokenId,
  amount
}: Props) => {
  const transactionAddress = {
    send: toAddress,
    interwallet: null,
    receive: fromAddress
  }[type];
  // type === "send" ? toAddress : fromAddress || fromAddresses[0];

  let formattedTransactionAddress = null;
  try {
    formattedTransactionAddress = tokenId
      ? SLP.Address.toSLPAddress(transactionAddress)
      : transactionAddress;

    // Above method returns an error instead of throwing one for now.
    if (typeof formattedTransactionAddress !== "string") {
      formattedTransactionAddress = null;
    }
  } catch (e) {
    formattedTransactionAddress = null;
  }

  let blockie = blockieCache[transactionAddress];
  if (!blockie) {
    const newBlockie = makeBlockie(transactionAddress || "unknown");
    blockieCache = { ...blockieCache, [transactionAddress]: newBlockie };
    blockie = newBlockie;
  }
  const imageSource = { uri: blockie };

  const typeFormatted = {
    send: "Send",
    interwallet: "Sent to self",
    receive: "Receive"
  }[type];

  // from addresses, all

  // received - amount
  // to/from: [address]
  // txid
  // timestamp -
  return (
    <Row type={type}>
      <DateRow>
        <T size="small" type="muted">
          {moment(timestamp).format("MM-DD-YYYY, h:mm a")}
        </T>
      </DateRow>
      <AmountRow>
        <IconArea>
          <IconImage source={imageSource} />
        </IconArea>
        <InfoArea>
          <T>{typeFormatted}</T>
        </InfoArea>
        <AmountArea>
          {type !== "interwallet" && (
            <T>
              {type === "send" ? "-" : "+"}
              {amount}
            </T>
          )}
        </AmountArea>
      </AmountRow>
      <MetaRow>
        {transactionAddress && <T size="tiny">{formattedTransactionAddress}</T>}
        <T size="tiny" type="muted">
          {txId}
        </T>
      </MetaRow>
    </Row>
  );
};

export default TransactionRow;
