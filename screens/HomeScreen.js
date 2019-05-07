// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  SectionList,
  View,
  TouchableOpacity
} from "react-native";
import uuidv5 from "uuid/v5";

import { connect } from "react-redux";

import { T, H1, Spacer } from "../atoms";

import { CoinRowHeader, CoinRow } from "../components";

import { balancesSelector, type Balances } from "../data/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector,
  getSeedViewedSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector } from "../data/prices/selectors";
import { doneInitialLoadSelector } from "../data/utxos/selectors";

import { type TokenData } from "../data/tokens/reducer";

import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";
import { updateTokensMeta } from "../data/tokens/actions";
import { updateSpotPrice } from "../data/prices/actions";

import { formatAmount } from "../utils/balance-utils";

const SECOND = 1000;

// Same as the Badger namespace for now.  doesn't need to be unique here.
const HASH_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

const BackupNotice = styled(TouchableOpacity)`
  border: 1px solid ${props => props.theme.accent500};
  padding: 7px;
  background-color: ${props => props.theme.accent900};
  margin: 5px;
`;

const NoTokensRow = styled(View)`
  padding: 10px;
`;

const NoTokensFound = () => (
  <NoTokensRow>
    <T size="small" type="muted2">
      No SLP tokens in the vault yet
    </T>
  </NoTokensRow>
);

const InitialLoadCover = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  left: 0;
  background-color: ${props => props.theme.coverBg};
  height: 100%;
  width: 100%;
  z-index: 1;
  align-items: center;
  justify-content: center;
`;

type Props = {
  address: string,
  addressSlp: string,
  balances: Balances,
  initialLoadingDone: boolean,
  latestTransactionHistoryBlock: number,
  navigation: { navigate: Function },
  seedViewed: boolean,
  spotPrices: any,
  tokensById: { [tokenId: string]: TokenData },
  updateSpotPrice: Function,
  updateTokensMeta: Function,
  updateTransactions: Function,
  updateUtxos: Function
};

const HomeScreen = ({
  address,
  addressSlp,
  balances,
  initialLoadingDone,
  navigation,
  seedViewed,
  spotPrices,
  tokensById,
  updateSpotPrice,
  updateTokensMeta,
  updateTransactions,
  updateUtxos
}: Props) => {
  useEffect(() => {
    if (!address) return;
    // Update UTXOs on an interval
    updateUtxos(address, addressSlp);
    const utxoInterval = setInterval(
      () => updateUtxos(address, addressSlp),
      10 * SECOND
    );
    return () => clearInterval(utxoInterval);
  }, [address]);

  // Update transaction history
  useEffect(() => {
    if (!address) return;
    updateTransactions(address, addressSlp);
    const transactionInterval = setInterval(
      () => updateTransactions(address, addressSlp),
      15 * 1000
    );
    return () => clearInterval(transactionInterval);
  }, [address]);

  const tokenIds = Object.keys(balances.slpTokens);
  const tokenIdsHash = uuidv5(tokenIds.join(""), HASH_UUID_NAMESPACE);

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = tokenIds.filter(tokenId => !tokensById[tokenId]);
    updateTokensMeta(missingTokenIds);
  }, [tokenIdsHash]);

  // Todo - Add `currency` as a dependency to recompute
  useEffect(() => {
    updateSpotPrice();
    const spotPriceInterval = setInterval(() => updateSpotPrice(), 60 * 1000);
    return () => clearInterval(spotPriceInterval);
  }, []);

  const slpTokens = balances.slpTokens;

  //[[tokenId, amount]]
  const slpTokensDisplay = Object.keys(slpTokens).map(key => [
    key,
    slpTokens[key]
  ]);

  const tokenData = slpTokensDisplay
    .filter(([tokenId, amount]) => amount.toNumber() !== 0)
    .map(([tokenId, amount]) => {
      const symbol = tokensById[tokenId] ? tokensById[tokenId].symbol : "---";
      const name = tokensById[tokenId] ? tokensById[tokenId].name : "--------";
      const decimals = tokensById[tokenId]
        ? tokensById[tokenId].decimals
        : null;
      const amountFormatted = formatAmount(amount, decimals);
      return {
        symbol,
        name,
        amount: amountFormatted,
        extra: "Simple Token",
        tokenId
      };
    })
    .sort((a, b) => {
      const symbolA = a.symbol.toUpperCase();
      const symbolB = b.symbol.toUpperCase();
      if (symbolA < symbolB) return -1;
      if (symbolA > symbolB) return 1;
      return 0;
    });

  const BCHFiatAmount =
    spotPrices["bch"]["usd"].rate * (balances.satoshisAvailable / 10 ** 8);

  const BCHFiatDisplay = spotPrices["bch"]["usd"].rate
    ? `$${BCHFiatAmount.toFixed(3)} USD`
    : "$ -.-- USD";

  const walletSections = [
    {
      title: "Bitcoin Cash Wallet",
      data: [
        {
          symbol: "BCH",
          name: "Bitcoin Cash",
          amount: formatAmount(balances.satoshisAvailable, 8),
          valueDisplay: BCHFiatDisplay
        }
      ]
    },
    {
      title: "Simple Token Vault",
      data: tokenData
    }
  ];

  return (
    <SafeAreaView>
      <View style={{ height: "100%" }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {!seedViewed ? (
            <>
              <BackupNotice
                onPress={() => navigation.navigate("ViewSeedPhrase")}
              >
                <T center size="small" type="accent">
                  Please backup your Seed Phrase
                </T>
              </BackupNotice>
              <Spacer small />
            </>
          ) : (
            <Spacer />
          )}
          <H1 center>Badger Mobile</H1>
          <Spacer small />
          <View style={{ position: "relative" }}>
            <SectionList
              sections={walletSections}
              renderSectionHeader={({ section }) => (
                <CoinRowHeader>{section.title}</CoinRowHeader>
              )}
              renderSectionFooter={({ section }) =>
                !section.data.length ? <NoTokensFound /> : null
              }
              renderItem={({ item }) =>
                item && (
                  <CoinRow
                    amount={item.amount}
                    extra={item.extra}
                    name={item.name}
                    ticker={item.symbol}
                    tokenId={item.tokenId}
                    valueDisplay={item.valueDisplay}
                    onPress={() =>
                      navigation.navigate("WalletDetailScreen", {
                        symbol: item.symbol,
                        tokenId: item.tokenId
                      })
                    }
                  />
                )
              }
              keyExtractor={(item, index) => `${index}`}
            />
            {!initialLoadingDone && (
              <InitialLoadCover>
                <ActivityIndicator />
                <Spacer small />
                <T>Checking Balances</T>
              </InitialLoadCover>
            )}
          </View>
          <Spacer small />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);

  const tokensById = tokensByIdSelector(state);

  const spotPrices = spotPricesSelector(state);

  const seedViewed = getSeedViewedSelector(state);

  const initialLoadingDone = doneInitialLoadSelector(state, address);

  return {
    address,
    addressSlp,
    seedViewed,
    balances,
    spotPrices,
    tokensById,
    initialLoadingDone
  };
};
const mapDispatchToProps = {
  updateSpotPrice,
  updateTokensMeta,
  updateTransactions,
  updateUtxos
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
