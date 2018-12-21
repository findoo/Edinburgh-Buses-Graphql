const { RESTDataSource } = require('apollo-datasource-rest');
const crypto = require("crypto");
const { format } = require("date-fns");

const API_KEY = "xxxxxxxxxxx";

class BusAPI extends RESTDataSource {

  constructor() {
    super();
    this.baseURL = 'http://ws.mybustracker.co.uk/';
  }

  willSendRequest(request) {
    request.params.set('module', 'json');
    request.params.set('key', this.getEncryptedKey());
  }

  getEncryptedKey() {
    let key = API_KEY + format(new Date(), "YYYYMMDDHH");
    return crypto
      .createHash("md5")
      .update(key)
      .digest("hex");
  }

  async getServices() {
    const data = await this.get("?function=getServices");
    return data.services;
  }

  async getDests() {
    const data = await this.get("?function=getDests");
    return data.dests;
  }

  async getBusStops() {
    const data = await this.get("?function=getBusStops");
    return data.busStops;
  }
}

module.exports = BusAPI;
