import Hashids from "hashids";
import { getEnv } from "../env.js";

export const hashids = new Hashids(getEnv("HASHIDS_SALT"), 14, 'abcdefghijkmnpqrstuvwxyz23456789')