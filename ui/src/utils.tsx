export const PACKAGE_SUBDOMAIN = "dartfrog-gliderlabs-os";
export const PROCESS_NAME = "dartfrog:dartfrog:gliderlabs.os";

export const BASE_URL = `/${PROCESS_NAME}/`;

if (window.our) window.our.process = BASE_URL?.replace("/", "");

export const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || `http://${PACKAGE_SUBDOMAIN}.localhost:8080`)}${BASE_URL}`;

// This env also has BASE_URL which should match the process + package name
export const WEBSOCKET_URL = import.meta.env.DEV
  ? `${PROXY_TARGET.replace('http', 'ws')}`
  : undefined;

export const DARTFROG_VERSION = "v0.5.1";