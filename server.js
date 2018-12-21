const { ApolloServer, gql } = require("apollo-server");
const BusAPI = require("./BusAPI");

const typeDefs = gql`
  type Query {
    getBusStops: [BusStop]
    getServices: [Service]
    getDests: [Destination]
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

  type BusStop {
    ref: String
    operatorId: String
    stopId: String
    name: String
    lat: Float
    long: Float
    cap: Int
    services: [Service]
    dests: [Destination]
  }
`;

const resolvers = {
  Query: {
    getServices: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getServices(),
    getDests: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getDests(),
    getBusStops: async (_source, _args, { dataSources }) =>
      dataSources.busAPI.getBusStops()
  },

  BusStop: {
    services: async (busStop, _args, { dataSources }) => {
      const servs = await dataSources.busAPI.getServices();
      return busStop.services.map(bs => servs.find(s => bs === s.ref));
    },
    dests: async (busStop, _args, { dataSources }) => {
      const dests = await dataSources.busAPI.getDests();
      return busStop.dests.map(bs => dests.find(s => bs === s.ref));
    }
  },

  Destination: {
    service: async (destination, _args, { dataSources }) => {
      const servs = await dataSources.busAPI.getServices();
      return servs.find(s => s.ref === destination.service);
    }
  },

  Service: {
    dests: async (service, _args, { dataSources }) => {
      const dests = await dataSources.busAPI.getDests();
      return service.dests.map(sd => dests.find(d => sd === d.ref));
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      busAPI: new BusAPI()
    };
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
