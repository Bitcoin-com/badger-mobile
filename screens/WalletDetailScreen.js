// @flow

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Linking,
  StyleSheet
} from "react-native";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import {
  balancesSelector,
  transactionsActiveAccountSelector,
  type Balances
} from "../data/selectors";
import { spotPricesSelector } from "../data/prices/selectors";

import { tokensByIdSelector } from "../data/tokens/selectors";
import { type Transaction } from "../data/transactions/reducer";
import { type TokenData } from "../data/tokens/reducer";

import { formatAmount } from "../utils/balance-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";
import { TransactionRow } from "../components";

import { addressToSlp } from "../utils/account-utils";

import { getTokenImage } from "../utils/token-utils";

const TransactionArea = styled(View)`
  border-top-width: ${StyleSheet.hairlineWidth};
  border-top-color: ${props => props.theme.fg700};
  position: relative;
`;

const ButtonGroup = styled(View)`
  flex-direction: row;
  justify-content: space-around;
`;

const ExplorerRow = styled(View)`
  padding: 10px 16px;
`;

const IconImage = styled(Image)`
  width: 64;
  height: 64;
  border-radius: 32;
  overflow: hidden;
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;

type Props = {
  address: string,
  addressSlp: string,
  balances: Balances,
  spotPrices: any,
  navigation: { navigate: Function, state: { params: any } },
  tokensById: { [tokenId: string]: TokenData },
  updateTransactions: Function,
  transactions: Transaction[]
};

const WalletDetailScreen = ({
  address,
  addressSlp,
  balances,
  navigation,
  tokensById,
  spotPrices,
  transactions,
  updateTransactions
}: Props) => {
  const { tokenId } = navigation.state.params;
  const token = tokensById[tokenId];

  const [simpleledgerAddress, setSimpleledgerAddress] = useState(addressSlp);

  async function convertToSimpleLedger() {
    const simpleLedger = await addressToSlp(addressSlp);
    setSimpleledgerAddress(simpleLedger);
    return simpleLedger;
  }

  useEffect(() => {
    convertToSimpleLedger();
  }, [addressSlp]);

  const isBCH = !tokenId;

  const name = isBCH ? "Bitcoin Cash" : token.name;
  const ticker = isBCH ? "BCH" : token.symbol;
  const decimals = isBCH ? 8 : token.decimals;
  const amount = isBCH
    ? balances.satoshisAvailable
    : balances.slpTokens[tokenId];

  const imageSource = getTokenImage(tokenId);

  const BCHFiatAmount = isBCH
    ? spotPrices["bch"]["usd"].rate * (balances.satoshisAvailable / 10 ** 8)
    : 0;
  const fiatDisplay = isBCH
    ? spotPrices["bch"]["usd"].rate
      ? `$${BCHFiatAmount.toFixed(3)} USD`
      : "$ -.-- USD"
    : null;

  const explorerUrl = isBCH
    ? `https://explorer.bitcoin.com/bch/address/${address}`
    : `https://explorer.bitcoin.com/bch/address/${simpleledgerAddress}`;

  return (
    <SafeAreaView>
      <ScrollView style={{ height: "100%" }}>
        <View>
          <Spacer small />
          <H1 center>{name}</H1>
          {tokenId && (
            <T size="tiny" center>
              {tokenId}
            </T>
          )}
          <Spacer small />
          <IconArea>
            <IconImage source={imageSource} />
          </IconArea>

          <Spacer />
          <T center>Balance</T>
          <H1 center>{formatAmount(amount, decimals)}</H1>
          {fiatDisplay && (
            <T center type="muted2">
              {fiatDisplay}
            </T>
          )}
          <Spacer />
          <ButtonGroup>
            <Button
              onPress={() =>
                navigation.navigate("SendSetup", { symbol: ticker, tokenId })
              }
              text="Send"
            />
          </ButtonGroup>
          <Spacer />
        </View>
        <Spacer small />
        <T
          style={{ marginLeft: 16, marginBottom: 5 }}
          size="small"
          type="muted"
        >
          Transaction History (max 30)
        </T>
        <TransactionArea>
          {transactions.map(tx => {
            const { hash, txParams, time } = tx;
            const {
              to,
              from,
              toAddresses,
              fromAddresses,
              transactionType,
              value
            } = txParams;

            const txType =
              to === address || to === addressSlp ? "receive" : "send";

            return (
              <TransactionRow
                key={hash}
                type={txType}
                timestamp={time}
                toAddress={to}
                toAddresses={toAddresses}
                fromAddresses={fromAddresses}
                fromAddress={from}
                symbol={ticker}
                tokenId={tokenId}
                amount={tokenId ? value : formatAmount(value, decimals)}
              />
            );
          })}
          <ExplorerRow>
            <Spacer small />
            <T
              center
              type="muted2"
              onPress={() => Linking.openURL(explorerUrl)}
            >
              Full History
            </T>
            <Spacer small />
          </ExplorerRow>
        </TransactionArea>
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const tokenId = props.navigation.state.params.tokenId;
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);
  const spotPrices = spotPricesSelector(state);

  const transactionsAll = transactionsActiveAccountSelector(state);

  const transactions = transactionsAll
    .filter(tx => {
      const txTokenId =
        tx.txParams.sendTokenData && tx.txParams.sendTokenData.tokenId;
      if (tokenId) {
        return tokenId === txTokenId;
      }
      return !txTokenId;
    })
    .slice(0, 30);

  return {
    address,
    addressSlp,
    balances,
    tokensById,
    transactions,
    spotPrices
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletDetailScreen);
