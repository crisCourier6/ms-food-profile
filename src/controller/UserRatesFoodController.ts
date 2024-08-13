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
        console.log("hola", userRate)
        if (!userRate) {
            console.log("pew")
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
            return []
        }
        return userRate
    }
    // cantidad de likes y dislikes de un alimento en específico
    async ratingsByFood(id: string, res: Response){
        const likes = await this.UserRatesFoodRepository.countBy({foodLocalId: id, rating: "likes"})
        const dislikes = await this.UserRatesFoodRepository.countBy({foodLocalId: id, rating: "dislikes"})
        const ratings: {likes: number, dislikes: number} = {
            likes: likes,
            dislikes: dislikes
        }
        return ratings
    }
    // agregar o actualizar registro.
    async create(userRate) {
        const oldUserRate = await this.UserRatesFoodRepository.findOne({ where: 
            {userId: userRate.userId, 
            foodLocalId: userRate.foodLocalId,
            rating: userRate.rating
        }})
        if (oldUserRate){
            console.log("ya existe", oldUserRate)
            return []
        }
        else {
            console.log("n oexistia")
            const newUserRate = await this.UserRatesFoodRepository.save(userRate)
                if (!newUserRate){
                    return []
                }
                return newUserRate
        }
        
    }
    // eliminar un registro por id de usuario e id de alimento
    async remove(userId: string, foodLocalId) {
        let userRateToRemove = await this.UserRatesFoodRepository.find({ where: {foodLocalId: foodLocalId, userId: userId }})

        if (userRateToRemove === undefined || userRateToRemove.length == 0) {
            return undefined
        }

        return this.UserRatesFoodRepository.delete({userId: userId, foodLocalId: foodLocalId})
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
    async removeByUser(id: string) {
        let userRateToRemove = await this.UserRatesFoodRepository.find({ where: {userId: id }})

        if (userRateToRemove === undefined || userRateToRemove.length == 0) {
            return undefined
        }

        return this.UserRatesFoodRepository.remove(userRateToRemove)
    }
}