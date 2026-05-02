"use strict";

const _store = {
  clientId: null,
  clientSecret: null,
  accessToken: null,
};

function setCredentials({ clientId, clientSecret, accessToken }) {
  _store.clientId = clientId;
  _store.clientSecret = clientSecret;
  _store.accessToken = accessToken;
}

function getToken() {
  return _store.accessToken;
}

function getClientId() {
  return _store.clientId;
}

function getClientSecret() {
  return _store.clientSecret;
}

function isAuthenticated() {
  return Boolean(_store.accessToken);
}

function clearCredentials() {
  _store.clientId = null;
  _store.clientSecret = null;
  _store.accessToken = null;
}

module.exports = {
  setCredentials,
  getToken,
  getClientId,
  getClientSecret,
  isAuthenticated,
  clearCredentials,
};
