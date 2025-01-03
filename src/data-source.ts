import "reflect-metadata"
import { DataSource } from "typeorm"
import { FoodLocal } from "./entity/FoodLocal"
import { UserRatesFood } from "./entity/UserRatesFood"
import { Additive } from "./entity/Additive"
import { Allergen } from "./entity/Allergen"
import "dotenv/config"
import { FoodHasAdditive } from "./entity/FoodHasAdditive"
import { FoodHasAllergen } from "./entity/FoodHasAllergen"

// AppDataSource contiene la configuración de la conexión con la base de datos del microservicio
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [FoodLocal, UserRatesFood, Additive, Allergen, FoodHasAdditive, FoodHasAllergen],
    migrations: [],
    subscribers: [],
})
