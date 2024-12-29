import { NextFunction, Request, Response } from "express"
import { FoodLocalController } from "./FoodLocalController"
import { UserRatesFoodController } from "./UserRatesFoodController"
import { FoodExternalController } from "./FoodExternalController"
import { Channel } from "amqplib"
import { FoodLocal } from "../entity/FoodLocal"
import { AllergenController } from "./AllergenController"


export class MainController{

    private foodLocalController = new FoodLocalController
    private userRatesFoodController = new UserRatesFoodController
    private foodExternalController = new FoodExternalController
    private allergenController = new AllergenController
    
    // food local
    async foodLocalAll(request: Request, response: Response, next: NextFunction, channel:Channel) {
        let foods = await this.foodLocalController.all(request, response)
        //foods = foods.resultsfilter(food => food !== null)
        //cuando se quiera llenar tablas en otros microservicios
        // foods.forEach(food => {
        //     channel.publish("FoodProfile", "food-local.save", Buffer.from(JSON.stringify(food)))
        // })
        return foods
    }
    async foodLocalOne(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.foodLocalController.one(request, response)
    }
    async foodLocalSaveLocal(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.foodLocalController.saveLocal(request.body, response)
    }
    async foodLocalUpdate(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.foodLocalController.update(request.params.foodLocalId, request.body, response)
    }
    async foodLocalRemove(request: Request, response: Response, next: NextFunction, channel:Channel){
        await this.foodLocalController.remove(request.params.foodLocalId, response)
        .then(result => {
            if (result){
                channel.publish("FoodProfile", "food-local.remove", Buffer.from(JSON.stringify({id: request.params.foodLocalId})))
            }
            else{
                response.status(400)
            }
            response.send(result)
        })
    }
    // user rates food
    async userRatesFoodAll(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.userRatesFoodController.all(request, response)
    }
    async userRatesFoodAllByUser(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.userRatesFoodController.byUser(request.params.userId, response)
    }
    async userRatesFoodOne(request: Request, response: Response, next: NextFunction, channel:Channel) {
        await this.userRatesFoodController.one(request.params.userId, request.params.foodLocalId, response)
        .then(result => {
                response.send(result)
        })
    }
    async userRatesFoodSave(request: Request, response: Response, next: NextFunction, channel:Channel) {
        await this.userRatesFoodController.create(request, response)
        .then(result => {
            if (result){
                channel.publish("FoodProfile", "user-rates-food.save", Buffer.from(JSON.stringify(request.body)))
            }
            else{
                response.status(400)
            }
            response.send(result)
        })
        
    }
    async userRatesFoodRemove(request: Request, response: Response, next: NextFunction, channel:Channel){
        await this.userRatesFoodController.remove(request, response)
        .then(result => {
            if (response.statusCode<400){
                channel.publish("FoodProfile", "user-rates-food.removeOne", Buffer.from(JSON.stringify(request.params)))
            }
            response.send(result)
        })
    }
    async userRatesFoodRemoveByUser(request: Request, response: Response, next: NextFunction, channel:Channel){
        return this.userRatesFoodController.removeByUser(request.params.userId)
    }
    async userRatesFoodRemoveByFood(request: Request, response: Response, next: NextFunction, channel:Channel){
        return this.userRatesFoodController.removeByFood(request.params.foodLocalId, response)
    }
    async userRatesFoodRatingsByFood(request: Request, response: Response, next: NextFunction, channel:Channel){
        return this.userRatesFoodController.ratingsByFood(request.params.foodLocalId, response)
    }
    // open food facts
    async foodExternalOne(request: Request, response: Response, next: NextFunction, channel:Channel){
        try {
            const food = await this.foodExternalController.one(request.params.id, response);
    
            // If the response status code is 400 or higher, return early
            if (response.statusCode >= 400) {
                return food
            }
    
            const result = await this.foodLocalController.save(food);
    
            if (result) {
                const fullFood = await this.foodLocalOne(request, response, next, channel)
                // Publish the result to the channel
                console.log("full_food: ", fullFood)
                channel.publish("FoodProfile", "food-local.save", Buffer.from(JSON.stringify(fullFood)));
    
                // Await the result of foodLocalOne and send it
                return fullFood
            } else {
                // Handle the case where save operation fails
                response.status(400);
                return response.send(result);
            }
        } catch (error) {
            // Handle any unexpected errors
            console.error(error);
            response.status(500).send({ error: "Server error" });
        }
    }
    // allergen
    async allergensAll(request: Request, response: Response, next: NextFunction, channel: Channel) {
        return this.allergenController.all()
    }
}