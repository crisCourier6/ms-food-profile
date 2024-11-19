import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { FoodLocal } from "../entity/FoodLocal"
import { In } from "typeorm"

export class FoodLocalController {

    private foodLocalRepository = AppDataSource.getRepository(FoodLocal)

    //all()
    // entradas:
    // salidas: Array con todas las filas de la tabla food_local
    async all(req:Request, res: Response) {
        const {u, ca, la, search, id, wu} = req.query;
        const wr = req.query.wr === "true";
        let containsAllergens = undefined
        let lacksAllergens = undefined
        if (ca){
            containsAllergens = ca.split(",")
        }
        if (la){
            lacksAllergens = la.split(",")
        }
        const queryBuilder = this.foodLocalRepository.createQueryBuilder("foodLocal");

        if (u) {
            queryBuilder.leftJoinAndSelect(
                "foodLocal.userRatesFood",
                "userRatesFood"
            )
            .andWhere("userRatesFood.userId = :u", { u }); // Apply the user filter
        }

        if (search) {
            console.log("search: ", search)
            queryBuilder.andWhere("foodLocal.name ILIKE :search", { search: `%${search}%` });
        }
    
        if (id) {
            queryBuilder.andWhere("foodLocal.id = :id", { id });
        }

        // Check for containsAllergens
        if (containsAllergens) {
            queryBuilder.andWhere(
                `EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text("foodLocal"."foodData"->'allergens_tags') allergen
                    WHERE allergen IN (:...containsAllergens)
                )OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text("foodLocal"."foodData"->'traces_tags') trace
                    WHERE trace IN (:...containsAllergens)
                )`
            ).setParameter("containsAllergens", containsAllergens);
        }

        // Check for lacksAllergens
        if (lacksAllergens) {
            queryBuilder.andWhere(
                `NOT EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text("foodLocal"."foodData"->'allergens_tags') allergen
                    WHERE allergen IN (:...lacksAllergens)
                )AND NOT EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text("foodLocal"."foodData"->'traces_tags') trace
                    WHERE trace IN (:...lacksAllergens)
                )`
            ).setParameter("lacksAllergens", lacksAllergens);
        }

        if (wr) {
            // Count 'likes' where rating is 'likes'
            queryBuilder.loadRelationCountAndMap(
                "foodLocal.likes", 
                "foodLocal.userRatesFood", 
                "userRatesFood", 
                (qb) => qb.andWhere("userRatesFood.rating = 'likes'")
            );

            // Count 'dislikes' where rating is 'dislikes'
            queryBuilder.loadRelationCountAndMap(
                "foodLocal.dislikes", 
                "foodLocal.userRatesFood", 
                "userRatesFood", 
                (qb) => qb.andWhere("userRatesFood.rating = 'dislikes'")
            );
        }
        // Apply the wu filter (show only this user's rating)
        if (wu) {
            queryBuilder.leftJoinAndSelect(
                "foodLocal.userRatesFood",
                "userRatesFoodForWu",
                "userRatesFoodForWu.userId = :wu"
            ).setParameter("wu", wu);
        }

        return queryBuilder.getMany();
    }
    //one(id: string)
    // entradas: id: id del alimento que se quiere encontrar
    // salidas: undefined - si es que no se encuentra el alimento
    //          foodlocal - alimento 
    async one(req: Request, res: Response) {
        const { u } = req.query;
        const { id } = req.params;
        const wr = req.query.wr === "true";
    
        const queryBuilder = this.foodLocalRepository.createQueryBuilder("foodLocal")
            .where("foodLocal.id = :id", { id }); // Find by ID
    
        if (u) {
            // Join userRatesFood when u is provided (filtering by userId)
            queryBuilder.leftJoinAndSelect(
                "foodLocal.userRatesFood",
                "userRatesFood",
                "userRatesFood.userId = :u",
                { u }
            );
        }
    
        if (wr) {
            // Count 'likes' where rating is 'likes'
            queryBuilder.loadRelationCountAndMap(
                "foodLocal.likes", 
                "foodLocal.userRatesFood", 
                "userRatesFood", 
                (qb) => qb.andWhere("userRatesFood.rating = 'likes'")
            );
    
            // Count 'dislikes' where rating is 'dislikes'
            queryBuilder.loadRelationCountAndMap(
                "foodLocal.dislikes", 
                "foodLocal.userRatesFood", 
                "userRatesFood", 
                (qb) => qb.andWhere("userRatesFood.rating = 'dislikes'")
            );
        }

        return queryBuilder.getOne();
    }
    //getAllByIds(ids:any)
    // entradas: ids: Array con id de alimentos que se quieren encontrar
    // salidas: undefined - si es que no se encuentran alimentos
    //          foodLocals - Array de alimentos
    async getAllbyIds(ids: any, res: Response){
        const foodLocals = await this.foodLocalRepository.find({where: {id: In(ids)}})
        if (!foodLocals){
            return undefined
        }
        return foodLocals
    }
    //saveLocal(food:any)
    // entradas: food: objeto con la forma de FoodLocal que se quiere agregar al repositorio
    // salidas: undefined - si es que no se puede agregar food al repositorio
    //          createdFoodLocal - registro agregado al repositorio
    async saveLocal(food: any, res: Response) {

       const createdFoodLocal = await this.foodLocalRepository.save(food) // si food.id ya existe en la tabla, save actualiza
       if (createdFoodLocal){                                             // el registro con los otros campos de food 
           return createdFoodLocal
       }
       return undefined
   }
    //saveLocal(id: string, foodExternal: any)
    // entradas: id: código de barras del alimento
    //           foodExternal: objeto con información de un alimento obtenido desde la API de OpenFoodFacts
    // salidas: undefined - si es que no se puede agregar foodLocal al repositorio
    //          createdFoodLocal - registro agregado al repositorio
    async save(id: string, foodExternal: any, res: Response) {
        if (!foodExternal){
            return undefined
        }
        type foodValues = {
            id: string
            product_name: string
            brands: string
            quantity: string
            selected_images: {
                front: {
                    display: {
                        en?:string,
                        es?:string,
                        fr?:string
                    }
                },
                ingredients: {
                    display: {
                        en?:string,
                        es?:string,
                        fr?:string
                    }
                },
                nutrition: {
                    display: {
                        en?:string,
                        es?:string,
                        fr?:string
                    }
                },
                packaging: {
                    display: {
                        en?:string,
                        es?:string,
                        fr?:string
                    }
                }
            }
        }

        const newFood = foodExternal.product as foodValues
        let fullname = newFood.product_name
        
        if(newFood.brands){
            fullname = fullname + " - " + newFood.brands.split(",")[0]
        }
        if (newFood.quantity){
            fullname = fullname + " - " + newFood.quantity
        }

        // let foodData = JSON.stringify(foodExternal.product)
        let foodData = foodExternal.product
        const foodLocal = Object.assign(new FoodLocal(), {
            id: newFood.id,
            name: fullname,
            picture: newFood.selected_images? newFood.selected_images.front.display.en || newFood.selected_images.front.display.es || newFood.selected_images.front.display.fr:undefined,
            foodData: foodData
        })

        const createdFoodLocal = await this.foodLocalRepository.save(foodLocal)
        if (createdFoodLocal){
            return createdFoodLocal
        }
        return undefined
    }
    //update(id: any, food: any)
    // entradas: id: código de barras del alimento que se quiere actualizar
    //           food: objeto con la forma de FoodLocal
    // salidas: undefined - si es que no se puede agregar food al repositorio
    //          updatedFoodLocal - registro actualizad
    // ************* save puede cumplir el mismo rol de esta función ***********************************
    // ***** pero update recibe un objeto FoodLocal, save recibe un objeto desde OpenFoodFacts *********
    async update(id: any, food: any, res: Response) {
        const updatedFoodLocal = await this.foodLocalRepository.update(id, food)
        if (updatedFoodLocal){
            return updatedFoodLocal
        }
        return undefined
        
    }
    // remove(id: string)
    // entradas: id: código de barras del alimento que se quiere eliminar
    // salidas: undefined - si es que no existe el alimento 
    //          removedFood - registro eliminado
    async remove(id: string, res: Response) {
        let foodLocalToRemove = await this.foodLocalRepository.findOneBy({ id: id })

        if (!foodLocalToRemove) {
            return undefined
        }

        const removedFood = await this.foodLocalRepository.remove(foodLocalToRemove)

        return removedFood
    }

    async updateSimple(req: any) {
        const {id, ...foodLocal} = req
        if (!id) {
            return "id inválida"
        }
       return this.foodLocalRepository.update(id, foodLocal)
    }

    async saveSimple(req: any) {
       return this.foodLocalRepository.save(req)
    }

}