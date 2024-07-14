import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { UserRatesFood } from "../entity/UserRatesFood"

export class UserRatesFoodController {

    private UserRatesFoodRepository = AppDataSource.getRepository(UserRatesFood)

    async all(res: Response) {
        return this.UserRatesFoodRepository.find()
    }
    //one(userId: string, foodLocalId: string)
    // entradas: userId: id del usuario
    //           foodLocalId: id del alimento
    // salidas: undefined - si es que no se encuentra el registro
    //          userRate - Registro encontrado
    async one(userId: string, foodLocalId: string, res: Response) {
        const userRate = await this.UserRatesFoodRepository.findOne({
            where: { userId: userId,
                     foodLocalId: foodLocalId
                    }
        })

        if (!userRate) {
            return undefined
        }
        return userRate
    }
    // Registros de un alimento en específico
    async byFood(id: string, res: Response){
        const userRate = await this.UserRatesFoodRepository.find({
            where: { foodLocalId: id }
        })

        if (userRate === undefined || userRate.length == 0){
            return "user/food pair doesn't exist"
        }
        return userRate
    }
    // Registros de un usuario en específico
    async byUser(id: string, res: Response){
        const userRate = await this.UserRatesFoodRepository.find({
            where: { userId: id }
        })
        console.log(userRate)
        if (userRate === undefined || userRate.length == 0){
            return "user/food pair doesn't exist"
        }
        return userRate
    }
    // cantidad de likes y dislikes de un alimento en específico
    async ratingsByFood(id: string, res: Response){
        const likes = await this.UserRatesFoodRepository.countBy({foodLocalId: id, rating: "like"})
        const dislikes = await this.UserRatesFoodRepository.countBy({foodLocalId: id, rating: "dislike"})
        const ratings: {likes: number, dislikes: number} = {
            likes: likes,
            dislikes: dislikes
        }
        return ratings
    }
    // agregar o actualizar registro. si el usuario retracta su like o dislike, se borra el registro existente
    async create(request, res: Response) {
        if (request.body.rating == "neutral"){
            return this.remove(request.body.userId, request.body.foodLocalId, res)
        }
        const userRate = Object.assign(new UserRatesFood(), {
            userId: request.body.userId,
            foodLocalId: request.body.foodLocalId,
            rating: request.body.rating
        })
        const newUserRate = await this.UserRatesFoodRepository.save(userRate)
        if (!newUserRate){
            return undefined
        }
        return newUserRate
    }
    // eliminar un registro por id de usuario e id de alimento
    async remove(userId: string, foodLocalId, res: Response) {
        let userRateToRemove = await this.UserRatesFoodRepository.find({ where: {foodLocalId: foodLocalId, userId: userId }})

        if (userRateToRemove === undefined || userRateToRemove.length == 0) {
            return "couldn't find user/food pair"
        }

        await this.UserRatesFoodRepository.remove(userRateToRemove)

        return "user/food pair has been removed"
    }
    // eliminar todos los registros de un alimento
    async removeByFood(id: string, res: Response) {
        let userRateToRemove = await this.UserRatesFoodRepository.find({ where: {foodLocalId: id }})

        if (userRateToRemove === undefined || userRateToRemove.length == 0) {
            return "couldn't find food with rates"
        }

        await this.UserRatesFoodRepository.remove(userRateToRemove)

        return "user/food pairs have been removed"
    }
    // eliminar todos los registros de un usuario
    async removeByUser(id: string, res: Response) {
        let userRateToRemove = await this.UserRatesFoodRepository.find({ where: {userId: id }})

        if (userRateToRemove === undefined || userRateToRemove.length == 0) {
            return "couldn't find food rated by this user"
        }

        await this.UserRatesFoodRepository.remove(userRateToRemove)

        return "user/food pairs have been removed"
    }

}