const Cookies = require('js-cookie');
const Wechat = wx || {};
const LocalStorage = window.localStorage || {};
/**
 * 过期单位
 * */
const EXPIRE_UNIT = {
  SECOND: 0,
  MINUTE: 1,
  HOUR: 2,
  DAY: 3,
  MONTH: 4
};

/**
 * 过期实例
 * */
class Expire {
  /**
   * @param amount 数量
   * @param unit 单位 @see EXPIRE_UNIT
   * */
  constructor (amount, unit) {
    let offset = amount;
    switch (unit || EXPIRE_UNIT.SECOND) {
      case EXPIRE_UNIT.MINUTE:
        offset *= 60;
        break;
      case EXPIRE_UNIT.HOUR:
        offset *= 3600;
        break;
      case EXPIRE_UNIT.DAY:
        offset *= 86400;
        break;
      case EXPIRE_UNIT.MONTH:
        offset *= 2592000;
        break;
    }
    this.expireDate = Date.now() + offset * 1000;
  }
}

class Storage {
  constructor () {
    this.EXPIRE_UNIT = EXPIRE_UNIT;
    this.Expire = Expire;
    this.supportWechatMiniProgram = typeof Wechat.getStorageSync === 'function' && typeof Wechat.setStorageSync === 'function' && typeof Wechat.removeStorageSync === 'function';
    this.supportLocalStorage = typeof LocalStorage.getItem === 'function' && typeof LocalStorage.setItem === 'function' && typeof LocalStorage.removeItem === 'function';
  }

  set (key, data, expire) {
    expire = expire || new this.Expire(30, this.EXPIRE_UNIT.DAY);
    const value = JSON.stringify({
      data, expire: expire.expireDate
    });
    if (this.supportWechatMiniProgram) {
      Wechat['setStorageSync'](key, value);
    } else if (this.supportLocalStorage) {
      LocalStorage.setItem(key, value);
    } else {
      Cookies['set'](key, value, { expires: 365 });
    }
  }

  get (key) {
    let value = '{}';
    if (this.supportWechatMiniProgram) {
      value = Wechat['getStorageSync'](key);
    } else if (this.supportLocalStorage) {
      value = LocalStorage.getItem(key);
    } else {
      value = Cookies['get'](key);
    }
    const _package = JSON.parse(value || '{}');
    if (Date.now() < _package.expire) {
      return _package.data;
    }
    this.remove(key);
    return null;
  }

  remove (key) {
    if (this.supportWechatMiniProgram) {
      Wechat['removeStorageSync'](key);
    } else if (this.supportLocalStorage) {
      LocalStorage.removeItem(key);
    } else {
      Cookies['remove'](key);
    }
  }
}

module.exports = new Storage();