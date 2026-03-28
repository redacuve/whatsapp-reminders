import dotenv from "dotenv";
import path from "path";

const ROOT_DIR = path.join(__dirname, "..");

dotenv.config({ path: path.join(ROOT_DIR, ".env.local") });
dotenv.config({ path: path.join(ROOT_DIR, ".env") });

export const MY_NUMBER = process.env.MY_NUMBER ?? "";
export const MY_NUMBER_LID = process.env.MY_NUMBER_LID ?? "";
export const MY_GROUP = process.env.MY_GROUP ?? "";
