import { NextFunction, Request, Response } from "express"
import { FoodLocalController } from "./FoodLocalController"
import { UserRatesFoodController } from "./UserRatesFoodController"
import { FoodExternalController } from "./FoodExternalController"


export class MainController{

    private foodLocalController = new FoodLocalController
    private userRatesFoodController = new UserRatesFoodController
    private foodExternalController = new FoodExternalController
    // food local
    async foodLocalAll(request: Request, response: Response, next: NextFunction) {
        return this.foodLocalController.all(response)
    }
    async foodLocalOne(request: Request, response: Response, next: NextFunction) {
        return this.foodLocalController.one(request.params.id, response)
    }
    async foodLocalSaveLocal(request: Request, response: Response, next: NextFunction) {
        return this.foodLocalController.saveLocal(request.body, response)
    }
    async foodLocalUpdate(request: Request, response: Response, next: NextFunction) {
        return this.foodLocalController.update(request.params.foodLocalId, request.body, response)
    }
    async foodLocalRemove(request: Request, response: Response, next: NextFunction){
        return this.foodLocalController.remove(request.params.foodLocalId, response)
    }
    // user rates food
    async userRatesFoodAll(request: Request, response: Response, next: NextFunction) {
        return this.userRatesFoodController.all(response)
    }
    async userRatesFoodAllByUser(request: Request, response: Response, next: NextFunction) {
        return this.userRatesFoodController.byUser(request.params.userId, response)
    }
    async userRatesFoodOne(request: Request, response: Response, next: NextFunction) {
        return this.userRatesFoodController.one(request.params.userId, request.body.foodLocalId, response)
    }
    async userRatesFoodSave(request: Request, response: Response, next: NextFunction) {
        return this.userRatesFoodController.create(request, response)
        
    }
    async userRatesFoodRemove(request: Request, response: Response, next: NextFunction){
        return this.userRatesFoodController.remove(request.body.userId, request.body.foodLocalId, response)
    }
    async userRatesFoodRemoveByUser(request: Request, response: Response, next: NextFunction){
        return this.userRatesFoodController.removeByUser(request.params.userId, response)
    }
    async userRatesFoodRemoveByFood(request: Request, response: Response, next: NextFunction){
        return this.userRatesFoodController.removeByFood(request.params.foodLocalId, response)
    }
    async userRatesFoodRatingsByFood(request: Request, response: Response, next: NextFunction){
        return this.userRatesFoodController.ratingsByFood(request.params.foodLocalId, response)
    }
    // open food facts
    async foodExternalOne(request: Request, response: Response, next: NextFunction){
        const food = await this.foodExternalController.one(request.params.foodExternalId, response)
        console.log(food)
        await this.foodLocalController.save(request.params.foodExternalId, food, response)
        return food
    }
}