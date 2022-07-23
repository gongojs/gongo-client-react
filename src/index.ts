export { default as db } from "gongo-client";
export * from "./liveQueries";
export * from "./subscriptions";

/*
const {
  useGongoCursor,
  useGongoLive,
  useGongoOne,
  useGongoUserId,
} = require("./liveQueries");
const {
  useGongoSub,
  useGongoIsPopulated,
  IsPopulated,
} = require("./subscriptions");
const db = require("gongo-client");

module.exports = {
  __esModule: true,
  db,

  useGongoCursor,
  useGongoLive,
  useGongoOne,
  useGongoUserId,

  useGongoSub,
  useGongoIsPopulated,
  IsPopulated,
};
*/
