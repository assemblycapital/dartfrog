export const IS_FAKE = false;
export const HUB_NODE = IS_FAKE ? "fake.dev" : "waterhouse.os";
export const PACKAGE_SUBDOMAIN = "dartfrog-herobrine-os";
export const PROCESS_NAME = "chess:dartfrog:herobrine.os";

export const BASE_URL = `/${PROCESS_NAME}/`;

if (window.our) window.our.process = BASE_URL?.replace("/", "");

export const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || `http://${PACKAGE_SUBDOMAIN}.localhost:8080`)}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
export const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;
