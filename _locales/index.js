const { NativeModules } = require("react-native");
const langs = require("./index.json");
const en = require("./en/messages.json");
const { get_lang } = require("../data/languages/index");

class lang {
  constructor(screen) {
    get_lang(data => {
      // console.log("data : ", data);
      let value = JSON.parse(data);
      // console.log(value);
      this.lang = value == null ? "en" : value.code;
    });
    console.log(this.lang);
    this.screen = screen;
  }

  getDBlang() {
    let lang =
      typeof this.lang == "string"
        ? this.lang
        : NativeModules.I18nManager.localeIdentifier.split("_")[0];

    switch (lang) {
      case "en":
        return en;
        break;
      default:
        return en;
        break;
    }
  }

  getStr(str) {
    let data = this.getDBlang();
    return data["pages"][this.screen][str].toString();
  }
}

export default lang;
