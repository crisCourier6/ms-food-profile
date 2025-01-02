import { AppDataSource } from "../data-source"
import { Request, Response } from "express"
import { FoodLocal } from "../entity/FoodLocal"
import { In } from "typeorm"
import { Allergen } from "../entity/Allergen"
import { Additive } from "../entity/Additive"
import { FoodHasAllergen } from "../entity/FoodHasAllergen"
import { FoodHasAdditive } from "../entity/FoodHasAdditive"

export class FoodLocalController {

    private readonly foodLocalRepository = AppDataSource.getRepository(FoodLocal)
    private readonly allergenRepository = AppDataSource.getRepository(Allergen)
    private readonly additiveRepository = AppDataSource.getRepository(Additive)
    private readonly foodHasAllergenRepository = AppDataSource.getRepository(FoodHasAllergen)
    private readonly foodHasAdditiveRepository = AppDataSource.getRepository(FoodHasAdditive)
    //all()
    // entradas:
    // salidas: Array con todas las filas de la tabla food_local
    async all(req:Request, res: Response) {
        const {u, ca, la, search, id, wu, page, limit} = req.query;
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
            queryBuilder.andWhere(
                `unaccent(foodLocal.name) ILIKE unaccent(:search)`,
                { search: `%${search}%` }
            );
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

        if (page && limit){
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            queryBuilder.skip(skip).take(take).orderBy("foodLocal.name", "ASC");

            const [results, total] = await queryBuilder.getManyAndCount();

            return {results, total}
        }
        else{
            return queryBuilder.getMany()
        }

        
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
            .where("foodLocal.id = :id", { id }) // Find by ID
            .leftJoinAndSelect( "foodLocal.foodHasAllergen","foodHasAllergen")
            .leftJoinAndSelect("foodHasAllergen.allergen", "allergen")
            .leftJoinAndSelect( "foodLocal.foodHasAdditive","foodHasAdditive")
            .leftJoinAndSelect("foodHasAdditive.additive", "additive")
    
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
        const { id, name, picture, foodData, foodHasAllergen, foodHasAdditive } = food;
        let foodLocal = await this.foodLocalRepository.findOne({ where: { id } });
        if (!foodLocal) {
            foodLocal = this.foodLocalRepository.create({ id });
        }
        foodLocal.name = name;
        foodLocal.picture = picture;
        foodLocal.foodData = foodData;

        await this.foodLocalRepository.save(foodLocal);

        // Handle Allergens
        for (const allergenData of foodHasAllergen) {
            let allergen = await this.allergenRepository.findOne({ where: { id: allergenData.allergenId } });
            if (allergen) {
                let foodHasAllergen = await this.foodHasAllergenRepository.findOne({
                    where: { foodLocal, allergen },
                });
                if (!foodHasAllergen) {
                    foodHasAllergen = this.foodHasAllergenRepository.create({
                        foodLocal,
                        allergen,
                    });
                }
    
                foodHasAllergen.isAllergen = allergenData.isAllergen;
                foodHasAllergen.isTrace = allergenData.isTrace;
    
                await this.foodHasAllergenRepository.save(foodHasAllergen);
            }
        }
        // Handle Additives
        for (const additiveData of foodHasAdditive) {
            let additive = await this.additiveRepository.findOne({ where: { id: additiveData.additiveId } });
            if (!additive) {
                additive = this.additiveRepository.create({ id: additiveData.additiveId });
                await this.additiveRepository.save(additive);
            }

            let foodHasAdditive = await this.foodHasAdditiveRepository.findOne({
                where: { foodLocal, additive },
            });
            if (!foodHasAdditive) {
                foodHasAdditive = this.foodHasAdditiveRepository.create({
                    foodLocal,
                    additive,
                });
            }

            await this.foodHasAdditiveRepository.save(foodHasAdditive);
            
        }
        return this.foodLocalRepository.findOne({where: {id: id}, relations: ["foodHasAllergen", "foodHasAdditive"]})
       
   }
    //saveLocal(id: string, foodExternal: any)
    // entradas: id: código de barras del alimento
    //           foodExternal: objeto con información de un alimento obtenido desde la API de OpenFoodFacts
    // salidas: undefined - si es que no se puede agregar foodLocal al repositorio
    //          createdFoodLocal - registro agregado al repositorio
    async save(foodExternal: any) {
        if (!foodExternal){
            return undefined
        }
        type foodValues = {
            id: string
            product_name: string
            brands: string
            quantity: string
            allergens_tags: string[]
            traces_tags: string[]
            additives_tags: string[]
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
        let foodLocal = await this.foodLocalRepository.findOne({ where: { id: newFood.id } });

        if (foodLocal) {
            // Merge new values into the existing entity
            foodLocal = Object.assign(foodLocal, {
                name: fullname,
                picture: newFood.selected_images?.front?.display.en || newFood.selected_images?.front?.display.es || newFood.selected_images?.front?.display.fr || undefined,
                foodData: foodData,
            });
        } else {
            // Create a new entity
            foodLocal = this.foodLocalRepository.create({
                id: newFood.id,
                name: fullname,
                picture: newFood.selected_images?.front?.display.en || newFood.selected_images?.front?.display.es || newFood.selected_images?.front?.display.fr || undefined,
                foodData: foodData,
            });
        }

        const createdFoodLocal = await this.foodLocalRepository.save(foodLocal)
        console.log("FOOOOOOOOOOOOOOOOOOOOOOD: ", createdFoodLocal)
        if (createdFoodLocal){
            if (!createdFoodLocal.hasLocalAllergens){
                if (newFood.traces_tags || newFood.allergens_tags) {
                    console.log("Estoy usando datos de off")
                    const allergenUpdates: { id: string; isAllergen?: boolean; isTrace?: boolean }[] = [];
                    await this.foodHasAllergenRepository.delete({
                        foodLocalId: createdFoodLocal.id,
                    });
                    for (const allergenId of newFood.allergens_tags || []) {
                        allergenUpdates.push({ id: allergenId, isAllergen: true });
                    }
                    for (const traceId of newFood.traces_tags || []) {
                        const existing = allergenUpdates.find((item) => item.id === traceId);
                        if (existing) {
                            existing.isTrace = true;
                        } else {
                            allergenUpdates.push({ id: traceId, isTrace: true });
                        }
                    }
                    for (const allergenUpdate of allergenUpdates) {
                        let allergen = await this.allergenRepository.findOne({ where: { id: allergenUpdate.id } });
                        if (allergen) {
                            let foodHasAllergen = await this.foodHasAllergenRepository.findOne({
                                where: {
                                    foodLocalId: createdFoodLocal.id,
                                    allergenId: allergen.id
                                },
                            });
                
                            if (!foodHasAllergen) {
                                foodHasAllergen = this.foodHasAllergenRepository.create({
                                    foodLocal: createdFoodLocal,
                                    allergen,
                                });
                            }
                
                            // Update the boolean fields
                            foodHasAllergen.isAllergen = allergenUpdate.isAllergen ?? foodHasAllergen.isAllergen;
                            foodHasAllergen.isTrace = allergenUpdate.isTrace ?? foodHasAllergen.isTrace;
                
                            await this.foodHasAllergenRepository.save(foodHasAllergen);
                        }
                    }
                }   
            }
            if (!createdFoodLocal.hasLocalAdditives){
                if (newFood.additives_tags) {
                    await this.foodHasAdditiveRepository.delete({
                        foodLocal: createdFoodLocal,
                    });
                    for (const additiveId of newFood.additives_tags) {
                        let additive = await this.additiveRepository.findOne({ where: { id: additiveId } });
                        if (!additive) {
                            additive = this.additiveRepository.create({ id: additiveId });
                            await this.additiveRepository.save(additive);
                        }

                       
        
                        const foodHasAdditive = this.foodHasAdditiveRepository.create({
                            foodLocal: createdFoodLocal,
                            additive,
                        });
                        await this.foodHasAdditiveRepository.save(foodHasAdditive);
                    }
                }
            }
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

    async saveSimple(food: FoodLocal) {
        if (!food){
            return undefined
        }

        // let foodData = JSON.stringify(foodExternal.product)
        const foodLocal = Object.assign(new FoodLocal(), {
            id: food.id,
            name: food.name,
            picture: food.picture,
            foodData: food.foodData,
            hasLocalAllergens: food.hasLocalAllergens,
            hasLocalAdditives: food.hasLocalAdditives
        })
        let newAllergenTags = []
        let newAdditiveTags = []
        let oldAllergenTags = []
        let oldTracesTags = []

        if (food.hasLocalAllergens){
            if (food.foodHasAllergen){
                newAllergenTags = food.foodHasAllergen.map(allergen => allergen)  
            }
            else{
                if (food.foodData.allergens){
                    oldAllergenTags = food.foodData.allergens.split(", ")
                }
                if (food.foodData.traces){
                    oldTracesTags = food.foodData.traces.split(", ")
                }
            }
        }
        else{
            oldAllergenTags = food.foodData.allergens_tags
            oldTracesTags = food.foodData.traces_tags
        }
        if(food.hasLocalAdditives){
            if (food.foodHasAllergen){
                newAdditiveTags = food.foodHasAdditive.map(additive => additive.additiveId)  
            }
            else{
                if (food.foodData.additives){
                    newAdditiveTags = food.foodData.additives.split(", ")
                }
            }
        }
        else{
            newAdditiveTags = food.foodData.additives_tags
        }

        const createdFoodLocal = await this.foodLocalRepository.save(foodLocal)
        if (createdFoodLocal){
            if (food.hasLocalAllergens) {
                await this.foodHasAllergenRepository.delete({
                    foodLocalId: createdFoodLocal.id
                });
                if (newAllergenTags.length>0){
                    for (const allergenUpdate of newAllergenTags) {
                        let allergen = await this.allergenRepository.findOne({ where: { id: allergenUpdate.allergenId } });
                        if (allergen) {
                            let foodHasAllergen = await this.foodHasAllergenRepository.findOne({
                                where: {
                                    foodLocalId: createdFoodLocal.id,
                                    allergenId: allergen.id
                                },
                            });
                
                            if (!foodHasAllergen) {
                                foodHasAllergen = this.foodHasAllergenRepository.create({
                                    foodLocal: createdFoodLocal,
                                    allergen,
                                });
                            }
                
                            // Update the boolean fields
                            foodHasAllergen.isAllergen = allergenUpdate.isAllergen ?? foodHasAllergen.isAllergen;
                            foodHasAllergen.isTrace = allergenUpdate.isTrace ?? foodHasAllergen.isTrace;
                
                            await this.foodHasAllergenRepository.save(foodHasAllergen);
                        }
                    }
                }
                else if (oldAllergenTags.length>0 || oldTracesTags.length>0){
                    let allAllergens = [...oldAllergenTags, ...oldTracesTags]
                    await this.foodHasAllergenRepository.delete({
                        foodLocal: createdFoodLocal,
                    });
                    for (const allergenId of allAllergens) {
                        let allergen = await this.allergenRepository.findOne({ where: { id: allergenId } });
                        if (allergen) {
                            const foodHasAllergen = this.foodHasAllergenRepository.create({
                                foodLocal: createdFoodLocal,
                                allergen,
                                isAllergen: oldAllergenTags.includes(allergen.id),
                                isTrace: oldTracesTags.includes(allergen.id)
                            });
                            await this.foodHasAllergenRepository.save(foodHasAllergen);
                        }
                    }
                }
                
            }
            else{
                let allAllergens = [...oldAllergenTags, ...oldTracesTags]
                await this.foodHasAllergenRepository.delete({
                    foodLocal: createdFoodLocal,
                });
                for (const allergenId of allAllergens) {
                    let allergen = await this.allergenRepository.findOne({ where: { id: allergenId } });
                    if (allergen) {
                        const foodHasAllergen = this.foodHasAllergenRepository.create({
                            foodLocal: createdFoodLocal,
                            allergen,
                            isAllergen: oldAllergenTags.includes(allergen.id),
                            isTrace: oldTracesTags.includes(allergen.id)
                        });
                        await this.foodHasAllergenRepository.save(foodHasAllergen);
                    }
                }
            }
            await this.foodHasAdditiveRepository.delete({
                foodLocal: createdFoodLocal,
            });
            for (const additiveId of newAdditiveTags) {
                let additive = await this.additiveRepository.findOne({ where: { id: additiveId } });
                if (!additive) {
                    additive = this.additiveRepository.create({ id: additiveId });
                    await this.additiveRepository.save(additive);
                }
                const foodHasAdditive = this.foodHasAdditiveRepository.create({
                    foodLocal: createdFoodLocal,
                    additive,
                });
                await this.foodHasAdditiveRepository.save(foodHasAdditive);
            }
            return this.foodLocalRepository.findOne({where: {id: createdFoodLocal.id}, relations: ["foodHasAdditive", "foodHasAllergen", "foodHasAdditive.additive", "foodHasAllergen.allergen"] })
        }
        return undefined
   }

}