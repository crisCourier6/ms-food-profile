import { FoodLocal } from "../entity/FoodLocal"
import { In } from "typeorm"
import axios from "axios"
import { NextFunction, Request, Response } from "express"

axios.defaults.baseURL = "https://world.openfoodfacts.net/api/v2/"

// fields contiene los campos que se obtendrán en la respuesta de la API de OpenFoodFacts
// https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/#get-/api/v2/product/-barcode-
const fields = "id,product_name,image_small_url,brands,nutriments,nutrient_levels,allergens,\
                nova_group,additives_tags,environment_impact_level,nutriscore_grade,ecoscore_grade,\
                ingredients,ingredients_text,quantity,serving_quantity,serving_size,image_front_url,\
                image_nutrition_url,image_url"


export class FoodExternalController {

    // one(id: string)
    // entrada: id: el código de barras de un producto
    // salida: json con el siguiente formato
    //          {code: string (código de respuesta http )
    //          status: integer (estado de la respuesta)
    //          status_verbose: string (estado de la respuesta)
    //          product: {} (información solicitada del producto)}
    async one(id: string, res: Response) {
        try {
            const response = await axios({
                method: "GET",
                url: "product/" + id + "?fields=" + fields
            })
            return response.data
        } catch (error){
            console.log("error")
            return false
        }
        
    }
}