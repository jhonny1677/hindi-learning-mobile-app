// Web configuration to prevent font loading issues
module.exports = {
  expo: {
    web: {
      build: {
        babel: {
          include: [
            'node_modules/react-native-vector-icons',
            'node_modules/@expo/vector-icons'
          ]
        }
      }
    }
  }
};