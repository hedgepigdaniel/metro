/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Config = require('metro/src/Config');
const TerminalReporter = require('metro/src/lib/TerminalReporter');

const defaults = require('./defaults/defaults');
const getMaxWorkers = require('metro/src/lib/getMaxWorkers');

const {Terminal} = require('metro-core');

import type {ConfigT, InputConfigT, Middleware} from './configTypes.flow';
import type {ConfigT as OldConfigT} from 'metro/src/Config';
import type {
  Module,
  TransformVariants,
} from 'metro/src/ModuleGraph/types.flow.js';
import type Server from 'metro/src/Server';
import type {Reporter} from 'metro/src/lib/reporting';
import type {Options as ServerOptions} from 'metro/src/shared/types.flow';

type DeprecatedMetroOptions = {|
  resetCache?: boolean,
|};

type PublicMetroOptions = {|
  ...DeprecatedMetroOptions,
  config?: OldConfigT,
  maxWorkers?: number,
  minifierPath?: string,
  port?: ?number,
  reporter?: Reporter,
|};

type PrivateMetroOptions = {|
  ...PublicMetroOptions,
  watch?: boolean,
|};

// We get the metro runServer signature here and create the new config out of it
function convertOldToNew({
  config = Config.DEFAULT,
  resetCache = false,
  maxWorkers = getMaxWorkers(),
  minifierPath,
  // $FlowFixMe TODO t0 https://github.com/facebook/flow/issues/183
  port = null,
  reporter = new TerminalReporter(new Terminal(process.stdout)),
  watch = false,
}: PrivateMetroOptions): InputConfigT {
  const {
    getBlacklistRE,
    cacheStores,
    createModuleIdFactory,
    cacheVersion,
    getProjectRoot,
    getWatchFolders,
    getTransformModulePath,
    resolveRequest,
    getAssetExts,
    getPlatforms,
    getProvidesModuleNodeModules,
    getResolverMainFields,
    getSourceExts,
    hasteImplModulePath,
    assetTransforms,
    dynamicDepsInPackages,
    getPolyfillModuleNames,
    getAsyncRequireModulePath,
    getRunModuleStatement,
    getPolyfills,
    postProcessBundleSourcemap,
    getModulesRunBeforeMainModule,
    getUseGlobalHotkey,
    enhanceMiddleware,
    assetRegistryPath,
    getEnableBabelRCLookup,
    getTransformOptions,
    postMinifyProcess,
    getWorkerPath,
    extraNodeModules,
    transformVariants,
    postProcessModules,
  } = config;

  const assetExts = defaults.assetExts.concat(
    (getAssetExts && getAssetExts()) || [],
  );
  const sourceExts = defaults.sourceExts.concat(
    (getSourceExts && getSourceExts()) || [],
  );
  const platforms = (getPlatforms && getPlatforms()) || [];

  const providesModuleNodeModules =
    typeof getProvidesModuleNodeModules === 'function'
      ? getProvidesModuleNodeModules()
      : defaults.providesModuleNodeModules;

  const watchFolders = getWatchFolders();

  return {
    resolver: {
      assetExts,
      platforms,
      providesModuleNodeModules,
      resolverMainFields: getResolverMainFields(),
      sourceExts,
      hasteImplModulePath,
      assetTransforms,
      extraNodeModules,
      resolveRequest,
      blacklistRE: getBlacklistRE() ? getBlacklistRE() : undefined,
    },
    serializer: {
      dynamicDepsInPackages,
      createModuleIdFactory,
      polyfillModuleNames: getPolyfillModuleNames(),
      asyncRequireModulePath: getAsyncRequireModulePath(),
      getRunModuleStatement,
      getPolyfills,
      postProcessBundleSourcemap,
      postProcessModules,
      getModulesRunBeforeMainModule,
    },
    server: {
      useGlobalHotkey: getUseGlobalHotkey(),
      port,
      enhanceMiddleware,
    },
    transformer: {
      assetRegistryPath,
      enableBabelRCLookup: getEnableBabelRCLookup(),
      getTransformOptions,
      postMinifyProcess,
      workerPath: getWorkerPath(),
      minifierPath,
      transformVariants:
        transformVariants == null ? undefined : transformVariants(),
    },

    reporter,
    cacheStores,
    cacheVersion,
    projectRoot: getProjectRoot(),
    watchFolders,
    transformModulePath: getTransformModulePath(),
    resetCache,
    watch,
  };
}

export type ConvertedOldConfigT = {
  serverOptions: ServerOptions,
  extraOptions: {
    enhanceMiddleware: (Middleware, Server) => Middleware,
    port: number,
    getUseGlobalHotkey: () => boolean,
    transformVariants: () => TransformVariants,
    postProcessModules: (
      modules: $ReadOnlyArray<Module>,
      paths: Array<string>,
    ) => $ReadOnlyArray<Module>,
  },
};

/**
 * Convert the new config format to the old config format which Metro understands.
 * Over time we will change Metro to understand the new configuration, when we're
 * there we can remove this function.
 */
function convertNewToOld(newConfig: ConfigT): ConvertedOldConfigT {
  const {
    resolver = {},
    serializer = {},
    server = {},
    transformer = {},
    reporter,
    cacheStores,
    cacheVersion,
    projectRoot,
    watchFolders,
    transformModulePath,
    resetCache,
    watch,
    maxWorkers,
  } = newConfig;

  const {
    assetExts,
    platforms,
    providesModuleNodeModules,
    resolverMainFields,
    sourceExts,
    hasteImplModulePath,
    assetTransforms,
    extraNodeModules,
    resolveRequest,
    blacklistRE,
  } = resolver;

  const {
    dynamicDepsInPackages,
    polyfillModuleNames,
    asyncRequireModulePath,
    getRunModuleStatement,
    getPolyfills,
    postProcessBundleSourcemap,
    getModulesRunBeforeMainModule,
    postProcessModules,
    createModuleIdFactory,
  } = serializer;

  const {useGlobalHotkey, port, enhanceMiddleware} = server;

  const {
    assetRegistryPath,
    enableBabelRCLookup,
    getTransformOptions,
    postMinifyProcess,
    workerPath,
    minifierPath,
    transformVariants,
  } = transformer;

  // Return old config
  const oldConfig: $Shape<ConvertedOldConfigT> = {
    serverOptions: {
      assetExts: assetTransforms ? [] : assetExts,
      assetTransforms,
      platforms,
      providesModuleNodeModules,
      getResolverMainFields: () => resolverMainFields,
      sourceExts: assetTransforms ? sourceExts.concat(assetExts) : sourceExts,
      dynamicDepsInPackages,
      polyfillModuleNames,
      extraNodeModules,
      asyncRequireModulePath,
      getRunModuleStatement,
      getPolyfills,
      postProcessBundleSourcemap,
      getModulesRunBeforeMainModule,
      assetRegistryPath,
      enableBabelRCLookup,
      getTransformOptions,
      postMinifyProcess,
      workerPath,
      minifierPath,
      cacheStores,
      cacheVersion,
      projectRoot,
      watchFolders,
      transformModulePath,
      resolveRequest,
      resetCache,
      watch,
      reporter,
      maxWorkers,

      createModuleIdFactory,
      hasteImplModulePath,
    },
    extraOptions: {
      enhanceMiddleware,
      getUseGlobalHotkey: () => useGlobalHotkey,
      port,
      transformVariants: () => transformVariants,
      postProcessModules,
    },
  };

  if (blacklistRE) {
    oldConfig.serverOptions.blacklistRE = blacklistRE;
  }

  return oldConfig;
}

module.exports = {
  convertNewToOld,
  convertOldToNew,
};
