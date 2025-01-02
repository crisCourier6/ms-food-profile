import { AppDataSource } from "../data-source"
import axios from "axios"
import { Response, Request } from "express"
import { Additive } from "../entity/Additive"
import "dotenv/config"

axios.defaults.baseURL = "https://world.openfoodfacts.org/"

// fields contiene los campos que se obtendrán en la respuesta de la API de OpenFoodFacts
// https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/#get-/api/v2/product/-barcode-
const fields = "id,product_name,brands,nutriments,nutrient_levels,allergens_tags,environment_impact_level,nutriscore_grade,ecoscore_grade,serving_quantity,serving_size,traces_tags"
const moreFields = "selected_images,nova_group,nutriscore_2023_tags,additives_tags,ingredients_text,quantity,product_name_es,ingredients_analysis_tags"


export class FoodExternalController {
    private readonly additiveRepository = AppDataSource.getRepository(Additive)
    // one(id: string)
    // entrada: id: el código de barras de un producto
    // salida: json con el siguiente formato
    //          {code: string (código de respuesta http )
    //          status: integer (estado de la respuesta)
    //          status_verbose: string (estado de la respuesta)
    //          product: {} (información solicitada del producto)}
    async one(id: string, res: Response) {
        const TIMEOUT = 8000; // 6 seconds
        try {
            let response = await axios({
                method: "GET",
                url: "api/v2/product/" + id + "?fields=" + fields,
                timeout: TIMEOUT
            })
            if (response.data.status_verbose === "product not found"){
                res.status(404)
                return {message: "Error: el producto no existe"}
            }
            let response2 = await axios({
                method: "GET",
                url: "api/v2/product/" + id + "?fields=" + moreFields,
                timeout: TIMEOUT
            })
            delete response2.data.product.additives
            let product_name = response.data.product.product_name
            let product_name_es = response2.data.product.product_name_es
            let nutriscore_2023_tags =  response2.data.product.nutriscore_2023_tags
            let nova_group = response2.data.product.nova_group
            if (!product_name){
                response.data.product.product_name = "Nombre desconocido"
            }
            if (product_name_es){
                response.data.product.product_name = product_name_es
            }
            if (nutriscore_2023_tags) {
                response2.data.product.nutriscore_grade = nutriscore_2023_tags[0]
            }
            if (!nova_group) {
                response2.data.product.nova_group = response.data.product.nutriments["nova-group"]
            }
            response.data.product = {...response.data.product, ...response2.data.product}
            let additiveList = []
            let additives_tags = response.data.product.additives_tags
            if (additives_tags){
                additiveList = additives_tags
            }
            let additiveFinal = []
            for (let additiveCode of additiveList){
                console.log(additiveCode)
                let additive = await this.additiveRepository.findOne({where: {id:additiveCode}})
                additiveFinal.push(additive.name + "," + additive.wikidata)
            }
            response.data.product.additives = additiveFinal
            res.status(200)
            console.log("fui a openfoodfacts")
            return response.data
        } catch (error: any) {
            console.error(error);
            if (error.code === "ECONNABORTED") {
                res.status(408); // HTTP 408 Request Timeout
                return { message: "Error: Request timed out" };
            } else {
                res.status(error.response?.status || 500); // Default to 500 if no status available
                return { message: error.response?.statusText || "Internal Server Error" };
            }
        }
        
    }
    // save
    async save(req: Request, res: Response) {
        try{
            let response = await axios({
                method: "GET",
                url: "cgi/product_jqm2.pl",
                params: {
                    ...req.body,
                    user_id: process.env.OFF_USER,
                    password: process.env.OFF_PASS
                }
            })
            console.log(response)
        } 
        catch (error){
            console.log(error)
            res.status(500)
            return false
        }
    }
}