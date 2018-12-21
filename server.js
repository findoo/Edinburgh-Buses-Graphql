const { ApolloServer, gql } = require("apollo-server");
const bngconvert = require("bngconvert");
const BusAPI = require("./BusAPI");

const typeDefs = gql`
  type Query {
    getBusStops: [BusStop]
    getServices: [Service]
    getDests: [Destination]
    getBuses: [Bus]
  }

  type Service {
    ref: String
    operatorId: String
    mnemo: String
    name: String
    dests: [Destination]
  }

  type Destination {
    ref: String
    operatorId: String
    name: String
    direction: String
    service: Service
  }

  type Journey {
    journeyId: String
    operatorId: String
    service: Service
    dest: Destination
    journeyTimeDatas: [JourneyTime]
    globalDisruption: Boolean
    serviceDisruption: Boolean
    serviceDiversion: Boolean
  }

  type JourneyTime {
    order: Int
    stop: BusStop
    day: Int
    minutes: Int
    reliability: String
    type: String
    busStopDisruption: Boolean
  }

  type Bus {
    busId: String
    service: Service
    dest: Destination
    nextStop: BusStop
    operatorId: String
    lat: Float
    lon: Float
    speed: String
    bearing: String
    lastTimeKnow: String
    journey: Journey
  }

  type BusStop {
    ref: String
    operatorId: String
    stopId: String
    name: String
    lat: Float
    lon: Float
    cap: Int
    services: [Service]
    dests: [Destination]
  }
`;

const mapRefsToObjects = (refs, objects, matcher = "ref") =>
  refs.map(r => objects.find(o => o[matcher] === r));

const resolvers = {
  Query: {
    getServices: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getServices(),
    getDests: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getDests(),
    getBuses: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getBuses(),
    getBusStops: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getBusStops()
  },

  BusStop: {
    services: async (busStop, _args, { dataSources }) =>
      mapRefsToObjects(
        busStop.services,
        await dataSources.busAPI.getServices()
      ),
    dests: async (busStop, _args, { dataSources }) =>
      mapRefsToObjects(busStop.dests, await dataSources.busAPI.getDests()),
    lat: busStop => bngconvert.OSGB36toWGS84(busStop.x, busStop.y)[0],
    lon: busStop => bngconvert.OSGB36toWGS84(busStop.x, busStop.y)[1]
  },

  Destination: {
    service: async (destination, _args, { dataSources }) =>
      mapRefsToObjects(
        [destination.service],
        await dataSources.busAPI.getServices()
      )[0]
  },

  Service: {
    dests: async (service, _args, { dataSources }) =>
      mapRefsToObjects(service.dests, await dataSources.busAPI.getDests())
  },

  Bus: {
    service: async (bus, _args, { dataSources }) =>
      mapRefsToObjects(
        [bus.refService],
        await dataSources.busAPI.getServices()
      )[0],
    dest: async (bus, _args, { dataSources }) =>
      mapRefsToObjects([bus.refDest], await dataSources.busAPI.getDests())[0],
    nextStop: async (bus, _args, { dataSources }) =>
      mapRefsToObjects(
        [bus.nextStop],
        await dataSources.busAPI.getBusStops(),
        "stopId"
      )[0],
    lat: bus => bngconvert.OSGB36toWGS84(bus.x, bus.y)[0],
    lon: bus => bngconvert.OSGB36toWGS84(bus.x, bus.y)[1],
    journey: async (bus, _args, { dataSources }) =>
      await dataSources.busAPI.getJourneyTimes(bus.nextStop, bus.journeyId)
  },

  Journey: {
    dest: async (journey, _args, { dataSources }) =>
      mapRefsToObjects(
        [journey.refDest],
        await dataSources.busAPI.getDests()
      )[0],
    service: async (journey, _args, { dataSources }) =>
      mapRefsToObjects(
        [journey.refService],
        await dataSources.busAPI.getServices()
      )[0]
  },

  JourneyTime: {
    stop: async (journeyTime, _args, { dataSources }) =>
      mapRefsToObjects(
        [journeyTime.stopId],
        await dataSources.busAPI.getBusStops(),
        "stopId"
      )[0]
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    busAPI: new BusAPI()
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
