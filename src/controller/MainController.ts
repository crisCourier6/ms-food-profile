import { NextFunction, Request, Response } from "express"
import { FoodLocalController } from "./FoodLocalController"
import { UserRatesFoodController } from "./UserRatesFoodController"
import { FoodExternalController } from "./FoodExternalController"
import { Channel } from "amqplib"


export class MainController{

    private foodLocalController = new FoodLocalController
    private userRatesFoodController = new UserRatesFoodController
    private foodExternalController = new FoodExternalController
    // food local
    async foodLocalAll(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.foodLocalController.all(response)
    }
    async foodLocalOne(request: Request, response: Response, next: NextFunction, channel:Channel) {
        return this.foodLocalController.one(request.params.id, response)
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
        return this.userRatesFoodController.all(response)
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
        await this.userRatesFoodController.create(request.body)
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
        await this.userRatesFoodController.remove(request.params.userId, request.params.foodLocalId)
        .then(result => {
            if (result){
                channel.publish("FoodProfile", "user-rates-food.removeOne", Buffer.from(JSON.stringify(request.params)))
            }
            else{
                response.status(400)
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
        const food = await this.foodExternalController.one(request.params.foodExternalId, response)
        await this.foodLocalController.save(request.params.foodExternalId, food, response)
        .then(result => {
            if (result){
                channel.publish("FoodProfile", "food-local.save", Buffer.from(JSON.stringify(result)))
            }
            else{
                response.status(400)
            }
            response.send(food)
        })
    }
}