import { FoodLocal } from "../entity/FoodLocal"
import { In } from "typeorm"
import axios from "axios"
import { NextFunction, Request, Response } from "express"

axios.defaults.baseURL = "https://world.openfoodfacts.net/api/v2/"

// fields contiene los campos que se obtendrán en la respuesta de la API de OpenFoodFacts
// https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/#get-/api/v2/product/-barcode-
const fields = "id,product_name,brands,nutriments,nutrient_levels,allergens_tags,\
                additives_tags,environment_impact_level,nutriscore_grade,ecoscore_grade,\
                ingredients,ingredients_text,quantity,serving_quantity,serving_size,traces_tags"
const images = "image_nutrition_url,image_url,image_packaging_url,image_ingredients_url,nova_group,nutriscore_2023_tags"


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
            let response = await axios({
                method: "GET",
                url: "product/" + id + "?fields=" + fields
            })
            let response2 = await axios({
                method: "GET",
                url: "product/" + id + "?fields=" + images
            })
            response2.data.product.nutriscore_2023_tags
                ?response2.data.product.nutriscore_grade = response2.data.product.nutriscore_2023_tags[0]
                :null
            response.data.product = {...response.data.product, ...response2.data.product}
            return response.data
        } catch (error){
            console.log("error")
            return false
        }
        
    }
}