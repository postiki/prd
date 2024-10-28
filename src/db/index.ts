import {DataSource} from "typeorm";
import {Card} from "./models/indext";
import config from "../config";

export const db = new DataSource({
    type: "postgres",
    host: config.dbUrl,
    port: 5432,
    username: "esp32",
    password: "postiki",
    database: "farm",
    synchronize: true,
    logging: ["error"],
    entities: [Card],
    subscribers: [],
    migrations: ['src/db/migrations/*.ts'],
    extra: {
        timezone: 'Asia/Tbilisi',
    },
})