const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      // Customize the Webpack config here
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Add any modules that need to be transpiled here
        ],
      },
    },
    argv
  );
  
  // Add any custom Webpack configurations here
  
  return config;
};
