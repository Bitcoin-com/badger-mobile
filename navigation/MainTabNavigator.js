// @flow

import React from "react";
import {
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ViewSeedScreen from "../screens/ViewSeedScreen";
import WalletDetailScreen from "../screens/WalletDetailScreen";
import ReceiveScreen from "../screens/ReceiveScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ContactUsScreen from "../screens/ContactUsScreen";

import { ViewTermsOfUseScreen } from "../screens/TermsOfUseScreen";
import { ViewPrivacyNoticeScreen } from "../screens/PrivacyNoticeScreen";

import SendStack from "./SendStack";

import { spaceBadger as theme } from "../themes/spaceBadger";

const HomeStack = createStackNavigator(
  {
    WalletDashboard: {
      screen: HomeScreen,
      navigationOptions: {
        header: null,
        tabBarLabel: "Wallets"
      }
    },
    WalletDetailScreen: {
      screen: WalletDetailScreen,
      navigationOptions: props => {
        const title = props.navigation.state.params.symbol;
        return {
          title: `$${title}`,

          headerBackTitleStyle: {
            color: theme.primary500
          },
          headerTintColor: theme.primary500,
          headerTitleStyle: { color: theme.fg200 }
        };
      }
    }
    // SendStack,
  },
  {
    navigationOptions: {
      tabBarLabel: "Wallets"
    }
  }
);

const ReceiveStack = createStackNavigator({
  Receive: { screen: ReceiveScreen, navigationOptions: { title: "Receive" } }
});

const SettingsStack = createStackNavigator(
  {
    SettingsList: {
      screen: SettingsScreen,
      navigationOptions: { title: "Settings" }
    },
    ViewSeedPhrase: {
      screen: ViewSeedScreen
    },
    ContactUsScreen: {
      screen: ContactUsScreen,
      navigationOptions: { title: "Contact Us" }
    },
    LogoutScreen: {
      screen: LogoutScreen
    }
  },
  {
    defaultNavigationOptions: {
      headerBackTitleStyle: {
        color: theme.primary500
      },
      headerTintColor: theme.primary500,
      headerTitleStyle: { color: theme.fg200 }
    },

    initialRouteName: "SettingsList"
  }
);

const BottomTabNavigator = createBottomTabNavigator(
  {
    Home: HomeStack,
    Receive: ReceiveStack,
    Settings: SettingsStack
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === "Home") {
          iconName = `ios-wallet`;
        } else if (routeName === "Settings") {
          iconName = `ios-settings`;
        } else if (routeName === "Receive") {
          iconName = "ios-download";
        }

        return (
          <Ionicons
            name={iconName}
            size={horizontal ? 20 : 25}
            color={tintColor}
          />
        );
      }
    }),

    tabBarOptions: {
      activeTintColor: theme.primary500,
      inactiveTintColor: theme.fg300,
      tabStyle: {
        paddingVertical: 5
      }
    }
  }
);

const MainAppStack = createStackNavigator(
  {
    MainAppTabs: BottomTabNavigator,
    SendStack: SendStack,
    ViewTermsOfUse: { screen: ViewTermsOfUseScreen },
    ViewPrivacyPolicy: { screen: ViewPrivacyNoticeScreen }
  },
  {
    initialRouteName: "MainAppTabs",
    headerMode: "none"
  }
);

export default MainAppStack;
