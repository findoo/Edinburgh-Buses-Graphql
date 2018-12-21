const { RESTDataSource } = require("apollo-datasource-rest");
const crypto = require("crypto");
const { format } = require("date-fns");
const Papa = require("papaparse");
const request = require("request");
const zlib = require("zlib");

const API_KEY = "xxxxxxxxxxx";

class BusAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "http://ws.mybustracker.co.uk/";
  }

  willSendRequest(request) {
    request.params.set("module", "json");
    request.params.set("key", this.getEncryptedKey());
  }

  getEncryptedKey() {
    const key = API_KEY + format(new Date(), "YYYYMMDDHH");
    return crypto
      .createHash("md5")
      .update(key)
      .digest("hex");
  }

  getGzipped(url) {
    return new Promise((res, rej) => {
      const headers = { "Accept-Encoding": "gzip" };
      const buffer = [];
      const gunzip = zlib.createGunzip();
      request({ url, headers }).pipe(gunzip);
      gunzip
        .on("data", data => buffer.push(data.toString()))
        .on("finish", () => res(buffer.join("")))
        .on("error", e => rej(e));
    });
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

  async getJourneyTimes(stopId, journeyId) {
    if (stopId && journeyId) {
      const data = await this.get(
        `?function=getJourneyTimes&stopId=${stopId}&journeyId=${journeyId}`
      );
      return data.journeyTimes[0];
    } else {
      return null;
    }
  }

  async getBuses() {
    const csvData = await this.getGzipped(
      `${
        this.baseURL
      }?module=csv&function=getVehicleLocations&key=${this.getEncryptedKey()}`
    );
    return Papa.parse(csvData, { header: true }).data;
  }
}

module.exports = BusAPI;
